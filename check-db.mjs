import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://iyyhrclnouhysuvsahmo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eWhyY2xub3VoeXN1dnNhaG1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzMzMzMzNywiZXhwIjoyMDk4OTA5MzM3fQ.JZZqSb4DeCQgBWnJS_swd471YlOHszctRniKUfnO0ac"
);

async function fix() {
  const { error } = await supabase.from("integrations").delete().eq("provider", "google");
  console.log("Deleted old tokens. Error:", error);
}

fix();
