/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as carts from "../carts.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as paymentAttemptTypes from "../paymentAttemptTypes.js";
import type * as paymentAttempts from "../paymentAttempts.js";
import type * as populateProducts from "../populateProducts.js";
import type * as products from "../products.js";
import type * as reviews from "../reviews.js";
import type * as updateImagePaths from "../updateImagePaths.js";
import type * as users from "../users.js";
import type * as wishlists from "../wishlists.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  carts: typeof carts;
  categories: typeof categories;
  http: typeof http;
  orders: typeof orders;
  paymentAttemptTypes: typeof paymentAttemptTypes;
  paymentAttempts: typeof paymentAttempts;
  populateProducts: typeof populateProducts;
  products: typeof products;
  reviews: typeof reviews;
  updateImagePaths: typeof updateImagePaths;
  users: typeof users;
  wishlists: typeof wishlists;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
