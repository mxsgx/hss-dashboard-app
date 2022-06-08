import * as Yup from "yup";
import { Field, Form, Formik, FormikHelpers } from "formik";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { checkCookies, removeCookies, setCookies } from "cookies-next";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useRouter } from "next/router";
import { useState } from "react";

import logo from "../public/assets/hss.png";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginFormValidationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email!").required("Email is required!"),
  password: Yup.string()
    .min(8, "Password is too short!")
    .required("Password is required!"),
});

const ReactSwal = withReactContent(Swal);

const ErrorSwal = ReactSwal.mixin({
  toast: true,
  position: "top-end",
  timer: 5000,
  timerProgressBar: true,
});

const Login: NextPage = () => {
  const [submitText, setSubmitText] = useState("Login");
  const [isLoggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const handleOnSubmit = (
    values: LoginFormValues,
    actions: FormikHelpers<LoginFormValues>
  ) => {
    actions.setSubmitting(true);

    setSubmitText("Logging in...");

    fetch("/api/login", {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(values),
      method: "POST",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }

        return res.json().then((data) => {
          throw data;
        });
      })
      .then(({ data: { token } }) => {
        setCookies("token", token);
        setLoggedIn(true);
        setSubmitText("Logged in redirecting...");

        router.push("/");
      })
      .catch(({ message }) => {
        ErrorSwal.fire({
          icon: "error",
          title: message,
          showConfirmButton: false,
          customClass: {
            popup:
              "!bg-stone-700 !border !border-solid !border-stone-600 !text-stone-300",
          },
        });

        setSubmitText("Login");
      })
      .finally(() => {
        actions.setSubmitting(false);
      });
  };

  return (
    <div className="flex flex-col justify-center h-screen justify-items-center">
      <Head>
        <title>Login | Holywings Sport Show</title>
        <meta name="description" content="Holywings Dashboard App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex mx-auto mb-4">
        <Image src={logo} alt="Holywings" />
      </div>

      <Formik
        initialValues={initialValues}
        onSubmit={handleOnSubmit}
        validationSchema={LoginFormValidationSchema}
        validateOnMount={true}
      >
        {({ errors, touched, isValid, isSubmitting }) => (
          <Form className="flex flex-col mx-auto w-full sm:w-2/3 md:w-1/3 p-4 justify-center justify-items-center">
            <div className="flex flex-col space-y-1 mb-3">
              <label
                htmlFor="email"
                className="text-stone-300 text-lg font-medium"
              >
                Email Address
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                className="bg-stone-700 text-gray-100 p-4 rounded-md outline-yellow-600"
                autoFocus={true}
                required={true}
              />
              {touched.email && errors.email && (
                <p className="font-normal text-red-700">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="password"
                className="text-stone-300 text-lg font-medium"
              >
                Password
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                className="bg-stone-700 text-gray-100 p-4 rounded-md outline-primary"
                required={true}
              />
              {touched.password && errors.password && (
                <p className="font-normal text-red-700">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              className={[
                isLoggedIn || !isValid || isSubmitting
                  ? "bg-stone-800 text-disabled"
                  : "bg-primary text-stone-800",
                "rounded-md p-4 my-4 text-lg font-medium uppercase",
              ].join(" ")}
              disabled={isLoggedIn || !isValid || isSubmitting}
            >
              {submitText}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { token } = context.req.cookies;

    if (token) {
      const res = await fetch(process.env.MICROGEN_REST_API + "/user", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const raw = await res.text();

      if (res.status === 200 && raw != "null") {
        return {
          redirect: {
            permanent: false,
            destination: "/",
          },
        };
      }

      if (checkCookies("token")) {
        removeCookies("token");
      }
    }
  } catch (e) {}

  return {
    props: {},
  };
};

export default Login;
