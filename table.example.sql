CREATE TABLE auth.users
(
  id                 integer    NOT NULL DEFAULT NEXTVAL('users_serial'::regclass),
  login              varchar    NOT NULL,
  active             boolean    NOT NULL DEFAULT true,
  password           varchar    NOT NULL
)
