import { Effect, Either, Option } from "effect";

// Option
const someValue = Option.some<number>(42);
const noValue = Option.none<number>();

const fromNull = Option.fromNullable(null);
const fromUndefined = Option.fromNullable(undefined);
const fromValue = Option.fromNullable("hello");

const user = [
  {
    id: "1",
    name: "Alice",
  },
];
const findUser = (id: string): Option.Option<{ id: string; name: string }> =>
  Option.fromNullable(user.find((u) => u.id === id));

const handleOption = (opt: Option.Option<number>) => {
  const value = Option.getOrElse(opt, () => 0);

  const result = Option.match(opt, {
    onNone: () => "No value",
    onSome: (value) => `Got ${value}`,
  });

  return { value, result };
};

interface ValidationError {
  field: string;
  message: string;
}

const validateEmail = (
  email: string,
): Either.Either<string, ValidationError> => {
  if (!email.includes("@")) {
    return Either.left({ field: "email", message: "Email must includes @" });
  }
  if (email.length < 5) {
    return Either.left({ field: "email", message: "Email too short" });
  }

  return Either.right(email.toLocaleLowerCase());
};

const handleEither = (result: Either.Either<string, ValidationError>) =>
  Either.match(result, {
    onLeft: (error) => `Field: ${error.field} message: ${error.message}`,
    onRight: (v) => v,
  });

const valid = validateEmail("alice@example.com");
const invalid = validateEmail("aliceexample.com");

console.log(handleEither(valid));
console.log(handleEither(invalid));

const cached: Record<number, { name: string }> = { 1: { name: "Alice" } };

const getCachedUser = (id: number): Option.Option<{ name: string }> =>
  Option.fromNullable(cached[id]);

const validatePassword = (
  password: string,
): Either.Either<string, ValidationError> =>
  password.length < 8
    ? Either.left({ field: "password", message: "Password too short" })
    : Either.right(password);

// map

const userEffect = Effect.succeed({
  id: "1",
  name: "Alice",
});
const withEffect = userEffect.pipe(
  Effect.map((user) => user.name.toUpperCase()),
);

const calculatePrice = Effect.succeed({ price: 100, quantity: 3 }).pipe(
  Effect.map(({ price, quantity }) => price * quantity),
  Effect.map((subtotal) => subtotal * 1.1),
  Effect.map((total) => `Total price: $${total.toFixed(2)}`),
);

// Flatmap when callback return another Effect
const fetchUserProfile = (userId: string) =>
  Effect.succeed({ userId, bio: "Hello!", avatar: "avatar.png" });

const withFlatMap = userEffect.pipe(
  Effect.flatMap((user) => fetchUserProfile(user.id)),
);

const processOrder = Effect.succeed({ orderId: "123", amount: 250 }).pipe(
  Effect.tap((order) => Effect.log(`Processing order ${order.orderId}`)),

  Effect.flatMap((order) =>
    order.amount > 0
      ? Effect.succeed(order)
      : Effect.fail(new Error("Invalid order amount")),
  ),

  Effect.map((order) => ({ ...order, total: order.amount * 1.1 })),
  Effect.tap((order) => Effect.logInfo(`Order total with tax: ${order.total}`)),

  Effect.map(
    (order) =>
      `Order ${order.orderId} processed with total amount is ${order.total} `,
  ),
);
