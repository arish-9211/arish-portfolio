export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (
    !response.headers
      .get("content-type")
      ?.includes("application/json")
  ) {
    throw new Error(
      "The backend is not connected. Run the MERN server to use this feature."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Request failed."
    );
  }

  return data;
}