CREATE TABLE auth.user
(
  id                 integer    NOT NULL DEFAULT NEXTVAL('user_serial'::regclass),
  login              varchar    NOT NULL,
  active             boolean    NOT NULL DEFAULT true,
  password           varchar    NOT NULL,
  notes              varchar
);
COMMENT ON COLUMN auth.user.login IS 'Login, minimum 3 letters';
COMMENT ON COLUMN auth.user.active IS 'Is account active?';
COMMENT ON COLUMN auth.user.password IS 'Please use minimum 8 letters, upper and lower case, number';
COMMENT ON COLUMN auth.user.notes IS 'Admin notes about user';
