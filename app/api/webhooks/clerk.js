import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "@clerk/clerk-sdk-node";

// Initialize Supabase client using the service key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

export async function POST(request) {
  // Read the raw payload
  const payload = await request.text();
  // Clerk sends a signature header that you need to verify
  const signature = request.headers.get("x-clerk-signature");

  try {
    // Verify the webhook payload using Clerk's SDK and your webhook secret
    const event = Webhook.verify(payload, signature, process.env.CLERK_WEBHOOK_SECRET);

    // Check for the user.created event type
    if (event.type === "user.created") {
      const clerkUser = event.data;

      // Insert a new record into your Supabase 'user' table
      const { error } = await supabase
        .from("user")
        .insert({
          clerk_id: clerkUser.id,
          email: clerkUser.email_addresses[0].email_address,
          // Add additional fields here if needed
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "User record created successfully" });
    }

    // If the event type isn't one you're handling, simply respond OK.
    return NextResponse.json({ message: "Event type not handled" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
