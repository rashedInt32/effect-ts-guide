import { Either, Option } from "effect";

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
