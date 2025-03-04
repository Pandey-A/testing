import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote";

export default async function Events() {
  const supabase = await createClient();

  // Fetch events along with the count of registrations and user IDs
  const { data: events } = await supabase.from("events").select(`
      id,
      name,
      post_image,
      description,
      event_time,
      location,
      created_at,
      registrations:registrations (id, user_id)
    `);

  return (
    <div>
      {/* Events Section */}
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Events</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300"
            >
              {/* Event Image */}
              <div className="w-full h-48 relative">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/events/${event.post_image}`}
                  alt={event.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>

              {/* Event Details */}
              <h2 className="text-xl font-semibold mt-4">{event.name}</h2>
              <p className="text-gray-600 text-sm">{event.description}</p>
              <p className="text-gray-500 text-xs mt-2">
                📅 {new Date(event.event_time).toLocaleDateString()} | 📍{" "}
                {event.location}
              </p>

              {/* Registration Details */}
              <p className="text-gray-500 text-xs mt-2">
                📝 {event.registrations.length} registrations
              </p>
              <div className="text-gray-600 text-xs mt-1">
                <strong>Registered User IDs:</strong>
                <ul className="list-disc list-inside">
                  {event.registrations.map((reg) => (
                    <li key={reg.id}>{reg.user_id}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
