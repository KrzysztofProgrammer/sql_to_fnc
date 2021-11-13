CREATE TABLE polisa.policy
(
  id_polisy integer NOT NULL DEFAULT NEXTVAL('polisy_id_polisy_seq'::regclass),
  numer varchar(30) NULL,
  poprzednia varchar(30) NULL,
  druk integer NULL,
  okresod timestamp NULL,
  okresdo timestamp NULL,
  firma_id integer NOT NULL,
  datapolisy timestamp NOT NULL DEFAULT now(),
  posr_id integer NOT NULL,
  datawpr timestamp NOT NULL DEFAULT now(),
  notatka text NULL,
  stan integer NULL DEFAULT 0,
  id_klienta integer NOT NULL,
  sprzedany bool NOT NULL DEFAULT false,
  datasprzedazy timestamp NULL,
  pojazd_id integer NULL,
  seria varchar(20) NULL,
  data_edycji timestamp(0) NOT NULL DEFAULT now(),
  operator_edycji integer NOT NULL
)
