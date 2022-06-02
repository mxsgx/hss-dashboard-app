import { gql } from "@apollo/client";
import { removeCookies } from "cookies-next";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import client from "../apollo-client";
import moment from "moment";

import logo from "../public/assets/hss.png";

interface User {
  firstName: string;
  lastName: string;
  role: "AUTHENTICATED" | "ADMIN";
}

interface HomeProps {
  user: User;
}

const GET_PURCHASES = gql`
  query GetPurchases(
    $skip: Int
    $limit: Int
    $livestreamId: String
    $phoneNumber: PhoneNumber
  ) {
    purchases: purchasesConnection(
      skip: $skip
      limit: $limit
      where: {
        livestreamId: $livestreamId
        purchasedBy: { phoneNumber_contains: $phoneNumber }
      }
      orderBy: createdAt_DESC
    ) {
      total
      skip
      data {
        user: purchasedBy {
          firstName
          lastName
          email
          phoneNumber
        }
        livestream {
          title
        }
        purchasedAt: createdAt
      }
    }
  }
`;

interface PurchaseData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  purchasedAt: string;
  livestream: {
    title: string;
  };
}

interface PurchasesResponse {
  purchases: {
    total: number;
    skip: number;
    data: PurchaseData[];
  };
}

const Home: NextPage<HomeProps> = ({ user }: HomeProps) => {
  const router = useRouter();

  const [search, setSearch] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [purchases, setPurchases] = useState<{
    total: number;
    data: PurchaseData[];
  }>();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async function () {
      setError(false);
      setLoading(true);

      try {
        const { data: response, error: apolloError } =
          await client.query<PurchasesResponse>({
            query: GET_PURCHASES,
            fetchPolicy: "cache-first",
            variables: {
              limit: limit,
              skip: (page - 1) * limit,
              livestreamId: process.env.NEXT_PUBLIC_LIVESTREAM_ID,
              phoneNumber: `+62${phoneNumber}`,
            },
          });

        if (apolloError) {
          setError(true);
        } else {
          setPurchases(response.purchases);
        }
      } catch (e) {
        setError(true);
      }

      setLoading(false);
    })();
  }, [page, limit, phoneNumber]);

  const handleLogout = () => {
    setLoggingOut(true);

    removeCookies("token");

    router.push("/login");
  };

  const handleNextPage = () => {
    if (purchases && purchases.data.length === limit) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleSearchInput = (event: any) => {
    setSearch(event.target.value);
  };

  const handleSearch = async (event: any) => {
    event.preventDefault();

    setPage(1);
    setPhoneNumber(search);
  };

  const handleRefresh = async () => {
    setError(false);
    setLoading(true);

    try {
      const { data: response, error: apolloError } =
        await client.query<PurchasesResponse>({
          query: GET_PURCHASES,
          fetchPolicy: "no-cache",
          variables: {
            limit: limit,
            skip: (page - 1) * limit,
            livestreamId: process.env.NEXT_PUBLIC_LIVESTREAM_ID,
            phoneNumber: `+62${phoneNumber}`,
          },
        });

      if (apolloError) {
        setError(true);
      } else {
        setPurchases(response.purchases);
      }
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setLoading(false);
  };

  if (user.role != "ADMIN") {
    return (
      <div className="flex flex-col h-screen justify-center items-center">
        <div className="mb-2">
          <Image
            src={logo}
            alt="Holywings"
            className="grayscale brightness-200"
          />
        </div>
        <p className="text-center text-stone-300 text-xl">
          You don&apos;t have authorization to see this page.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="text-primary text-xl"
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out" : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full sm:w-3/4 md:w-2/3 py-6">
      <Head>
        <title>Dashboard | Holywings Sport Show</title>
        <meta name="description" content="Holywings Dashboard App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-stone-50 flex flex-col space-y-4">
        <header className="flex flex-row justify-between justify-items-center pb-2 px-4 border-b-2 border-disabled-button space-x-4">
          <div className="relative h-24 w-36">
            <Image src={logo} alt="Holywings" priority={true} layout="fill" />
          </div>
          <div className="flex items-center">
            <span className="mr-1">Hello {user.firstName},</span>
            <button
              type="button"
              className="text-primary"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out" : "Logout"}
            </button>
          </div>
        </header>
        <main>
          <div className="flex flex-col space-y-4 px-4">
            <div className="flex flex-col space-y-4 space-x-0 sm:space-x-4 sm:space-y-0 sm:flex-row justify-between items-center">
              <div>
                <h3 className="text-xl font-medium text-stone-100 md:mb-2">
                  Ticket Purchased
                </h3>
                <p className="font-light text-sm hidden md:block">
                  List of all members who already purchased ticket HSS 2.
                </p>
              </div>
              <form
                className="flex flex-row items-center shadow-md w-full sm:w-auto"
                onSubmit={handleSearch}
              >
                <label
                  htmlFor="search"
                  className="text-sm py-3 px-3 bg-stone-700 rounded-l-md border border-stone-700 text-stone-300 align-middle font-medium"
                >
                  +62
                </label>
                <input
                  type="number"
                  pattern="^8([0-9]+)"
                  id="search"
                  min={8}
                  className={[
                    loading
                      ? "bg-stone-800 text-stone-600"
                      : "bg-stone-700 text-stone-300",
                    "py-3 px-2 -ml-1 text-sm border w-full border-stone-700 outline-none rounded-r-md",
                  ].join(" ")}
                  placeholder="8xxx"
                  value={search}
                  disabled={loading}
                  onChange={handleSearchInput}
                />
              </form>
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left text-stone-400">
                <thead className="text-xs uppercase bg-stone-700 text-stone-300">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Member
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Ticket
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Purchase At
                    </th>
                  </tr>
                </thead>
                <tbody className={loading ? "animate-pulse" : ""}>
                  {loading ? (
                    Array(10)
                      .fill(undefined)
                      .map((value, index) => {
                        return (
                          <tr
                            key={`row-${index}`}
                            className={[
                              index + 1 === 10 ? "" : "border-b",
                              "bg-stone-800 border-b-stone-700",
                            ].join(" ")}
                          >
                            <td className="px-6 py-5">
                              <div className="h-2 bg-stone-700 rounded lg:w-48 mb-4"></div>
                              <div className="h-2 bg-stone-700 rounded lg:w-32"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-2 bg-stone-700 rounded lg:w-32"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-2 bg-stone-700 rounded"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-2 bg-stone-700 rounded w-full"></div>
                            </td>
                          </tr>
                        );
                      })
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="text-center py-3 bg-stone-800">
                        Error when fetching data!
                      </td>
                    </tr>
                  ) : purchases && purchases?.data.length > 0 ? (
                    purchases?.data.map((value, index) => {
                      return (
                        <tr
                          key={value.user.phoneNumber}
                          className={[
                            index + 1 === purchases.data.length
                              ? ""
                              : "border-b",
                            "bg-stone-800 border-b-stone-700 transition-all hover:bg-stone-700",
                          ].join(" ")}
                        >
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium whitespace-nowrap uppercase"
                          >
                            <span className="block">
                              {value.user.firstName + " " + value.user.lastName}
                            </span>
                            <span className="font-thin lowercase block">
                              {value.user.email}
                            </span>
                          </th>
                          <td className="px-6 py-4 font-mono">
                            {value.user.phoneNumber}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {value.livestream.title}
                          </td>
                          <td className="px-6 py-4 font-mono text-right">
                            {moment(value.purchasedAt).format(
                              "dddd, DD-MM-YYYY \\a\\t HH:mm"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-3 bg-stone-800">
                        Not found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-row space-x-4 justify-center">
              <button
                type="button"
                disabled={loading || page < 2}
                className="disabled:text-stone-600 font-bold shadow-sm transition-colors hover:text-primary"
                onClick={handlePrevPage}
                title="Next Page"
              >
                &laquo; Prev
              </button>
              <button
                type="button"
                disabled={loading}
                title="Refresh"
                onClick={handleRefresh}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={[
                    "icon icon-tabler icon-tabler-rotate-clockwise shadow-sm transition-colors hover:text-primary",
                    loading ? "animate-spin stroke-stone-600" : "",
                  ].join(" ")}
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <desc>
                    Download more icon variants from
                    https://tabler-icons.io/i/rotate-clockwise
                  </desc>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5"></path>
                </svg>
              </button>
              <button
                type="button"
                disabled={
                  loading || (purchases && purchases.data.length < limit)
                }
                className="disabled:text-stone-600 font-bold shadow-sm transition-colors hover:text-primary"
                onClick={handleNextPage}
                title="Previous Page"
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </main>
        <footer className="py-4">
          <p className="text-center text-sm">
            Built with Next.js &amp; TailwindCSS
          </p>
        </footer>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { token } = context.req.cookies;

    if (!token) {
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    }

    const res = await fetch(process.env.MICROGEN_REST_API + "/user", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const raw = await res.text();

    if (res.status === 200 && raw != "null") {
      const { firstName, lastName, role } = JSON.parse(raw);

      return {
        props: {
          token,
          user: { firstName, lastName, role },
        },
      };
    }
  } catch (e) {}

  return {
    props: {},
  };
};

export default Home;
