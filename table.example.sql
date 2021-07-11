CREATE TABLE auth.users
(
  id                 integer    NOT NULL DEFAULT NEXTVAL('users_serial'::regclass),
  active             boolean    NOT NULL DEFAULT true,
  login              varchar    NOT NULL,
  password           varchar    NOT NULL
)
