const BASE_URL = "https://pix-ai-backend.onrender.com";

export const enhanceImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/enhance`, {
    method: "POST",
    body: formData,
  });

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const removeBg = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/remove-bg`, {
    method: "POST",
    body: formData,
  });

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};