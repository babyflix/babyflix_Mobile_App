import Stripe from "stripe";
import { connectToDatabase } from "./db/connection";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { planId } = req.body;

  try {
    const connection = await connectToDatabase();

    // Fetch plan details
    const [rows] = await connection.execute(
      `SELECT * FROM storagePlans WHERE id = ? AND is_active = 1 LIMIT 1`,
      [planId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Plan not found or inactive" });
    }

    const plan = rows[0];
    const amount = Math.round(parseFloat(plan.price_per_month) * 100); // USD cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Storage Plan - ${plan.name}`,
              description: plan.description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin || "https://dev.babyflix.net/"}payment-status/success`,
      cancel_url: `${req.headers.origin || "https://dev.babyflix.net/"}payment-status/failed`,
    });

    return res.status(200).json({
      sessionId: session.id,
      sessionUrl: `https://checkout.stripe.com/c/${session.id}`
    });

  } catch (err) {
    console.error("Stripe session creation error:", err.message);
    return res.status(500).json({ error: "Stripe session creation failed." });
  }
}










//  {previewItem && previewItem.object_url && (
//         <Modal 
//           animationType="fade"
//           transparent={true}
//           visible={modalVisible}
//           onRequestClose={closeModal}
//         >
//             <View style={styles.modalOverlay}>
//               <View style={[styles.modalContent,isFullScreen && styles.maxRotateModelContent,isMaximized && styles.maxModalContent]}>
//                 {previewItem.object_type === 'video' ? (
//                   <Video
//                     key={previewItem?.id}
//                     source={{ uri: previewItem.object_url }}
//                     style={[styles.modalVideo, isFullScreen && { width: '100%', height: '100%' }]}
//                     useNativeControls
//                     shouldPlay={modalVisible}
//                     isLooping
//                     isMuted={isMuted}
//                     resizeMode="contain"
//                   />

//  closeButton: {
//     position: 'absolute',
//     top: 5,
//     right: 2,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     padding: 5,
//     borderRadius: 5,
//     zIndex: 999,
//   },