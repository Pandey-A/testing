// SERVER SIDE :
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: blogs } = await supabase.from("blogs").select();

  return <pre>{JSON.stringify(blogs, null, 2)}</pre>;
}
