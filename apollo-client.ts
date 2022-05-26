import {
  ApolloClient,
  ApolloLink,
  concat,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { getCookie } from "cookies-next";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_MICROGEN_GRAPHQL,
});

const authMiddleware = new ApolloLink((operation, forward) => {
  const token = getCookie("token");

  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : "",
    },
  });

  return forward(operation);
});

const client = new ApolloClient({
  link: concat(authMiddleware, httpLink),
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default client;
