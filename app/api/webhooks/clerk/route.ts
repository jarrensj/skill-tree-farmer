import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WebhookEvent, UserJSON } from "@clerk/nextjs/server";
import { Webhook } from "svix";

type UserData = {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_seen: string;
};

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY');
}
if (!process.env.CLERK_WEBHOOK_SECRET) {
  throw new Error('Missing CLERK_WEBHOOK_SECRET');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Missing required Svix headers" },
        { status: 400 }
      );
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;
    
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const eventType = evt.type;
    const userData = evt.data as UserJSON;

    switch (eventType) {
      case "user.created": {
        const userDataToInsert: UserData = {
          id: userData.id,
          clerk_id: userData.id,
          email: userData.email_addresses[0].email_address,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from("users")
          .insert(userDataToInsert);

        if (error) {
          console.error('❌ Error creating user:', error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { message: "User created successfully" },
          { status: 201 }
        );
      }

      case "user.updated": {
        const updateData = {
          email: userData.email_addresses[0].email_address,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("clerk_id", userData.id);

        if (error) {
          console.error('❌ Error updating user:', error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { message: "User updated successfully" },
          { status: 200 }
        );
      }

      case "user.deleted": {
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("clerk_id", userData.id);

        if (error) {
          console.error('❌ Error deleting user:', error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { message: "User deleted successfully" },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json(
          { message: `Event type ${eventType} not handled` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
