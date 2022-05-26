import * as Yup from "yup";
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

type Data = {
  status: "error" | "fail" | "success";
  data?: {
    [key: string]: any;
  };
  message?: string;
};

type LoginResponse = {
  token: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed.",
    });
  }

  const validation = Yup.object().shape({
    email: Yup.string().email("Invalid email!").required("Email is required!"),
    password: Yup.string()
      .min(8, "Password is too short!")
      .required("Password is required!"),
  });

  try {
    const body = await validation.validate(req.body);

    const response = await fetch(process.env.MICROGEN_REST_API + "/login", {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      method: "POST",
    });

    if (response.ok) {
      const { token } = (await response.json()) as LoginResponse;

      return res.status(200).json({
        status: "success",
        data: {
          token,
        },
      });
    }

    if (response.status === 401) {
      return res.status(400).json({
        status: "fail",
        message: "Credentials doesn't match in our records",
      });
    }
  } catch (e) {
    if (e instanceof Yup.ValidationError) {
      return res.status(400).json({
        status: "fail",
        message: e.message,
      });
    }
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error.",
  });
}
