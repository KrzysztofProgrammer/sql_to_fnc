CREATE TABLE auth.user
(
  id                 integer    NOT NULL DEFAULT NEXTVAL('user_serial'::regclass),
  login              varchar    NOT NULL,
  active             boolean    NOT NULL DEFAULT true,
  password           varchar    NOT NULL
)
