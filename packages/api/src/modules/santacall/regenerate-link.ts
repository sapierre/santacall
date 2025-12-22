import { EmailTemplate } from "@turbostarter/email";
import { sendEmail } from "@turbostarter/email/server";
import { HttpStatusCode } from "@turbostarter/shared/constants";
import { HttpException } from "@turbostarter/shared/utils";

import { env } from "./env";
import {
  updateOrder,
  generateDeliveryToken,
  createLinkRegeneration,
} from "./mutations";
import { getOrderById } from "./queries";

/**
 * Regenerate delivery link for an order
 * Admin-only function to generate a new delivery token and send updated link to customer
 */
export const regenerateOrderLink = async (orderId: string) => {
  // Fetch the order
  const order = await getOrderById(orderId);

  if (!order) {
    throw new HttpException(HttpStatusCode.NOT_FOUND, {
      code: "error.order_not_found",
    });
  }

  // Only regenerate links for paid orders with delivery URLs
  if (order.status !== "ready" && order.status !== "delivered") {
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "error.order_not_ready",
      message: "Can only regenerate links for ready or delivered orders",
    });
  }

  if (!order.deliveryUrl) {
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "error.no_delivery_url",
      message: "Order does not have a delivery URL to regenerate link for",
    });
  }

  // Save the previous token before generating new one
  const previousToken = order.deliveryToken ?? "";

  // Generate new delivery token
  const newDeliveryToken = generateDeliveryToken();

  // Update the order with new token
  const updatedOrder = await updateOrder(orderId, {
    deliveryToken: newDeliveryToken,
  });

  if (!updatedOrder) {
    throw new HttpException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
      code: "error.update_failed",
    });
  }

  // Construct the new view URL
  const viewUrl = `${env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}?token=${newDeliveryToken}`;

  // Send email notification with new link
  let emailSent = false;
  try {
    await sendEmail({
      to: order.customerEmail,
      template: EmailTemplate.SANTACALL_LINK_REGENERATED,
      variables: {
        customerName: order.customerName,
        childName: order.childName,
        viewUrl,
        orderType: order.orderType,
      },
    });
    emailSent = true;
    console.log(
      `Link regenerated and email sent to ${order.customerEmail} for order ${order.orderNumber}`,
    );
  } catch (emailError) {
    console.error(`Failed to send regenerated link email:`, emailError);
    // Don't fail the operation - link was regenerated successfully
  }

  // Log the regeneration to history table
  await createLinkRegeneration({
    orderId,
    previousToken,
    newToken: newDeliveryToken,
    newViewUrl: viewUrl,
    emailSent,
  });

  return {
    success: true,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    newToken: newDeliveryToken,
    viewUrl,
    emailSent,
  };
};
