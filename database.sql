CREATE TABLE IF NOT EXISTS public.users
(
    user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    firstname character varying COLLATE pg_catalog."default",
    lastname character varying COLLATE pg_catalog."default",
    email character varying COLLATE pg_catalog."default",
    password character varying COLLATE pg_catalog."default",
    role character varying COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (user_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;


    CREATE TABLE IF NOT EXISTS public.posts
(
    post_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    category character varying COLLATE pg_catalog."default",
    breed character varying COLLATE pg_catalog."default",
    price character varying COLLATE pg_catalog."default",
    description character varying COLLATE pg_catalog."default",
    user_id uuid,
    CONSTRAINT posts_pkey PRIMARY KEY (post_id),
    CONSTRAINT user_id FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.posts
    OWNER to postgres;


    CREATE TABLE IF NOT EXISTS public.image
(
    image_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    url character varying COLLATE pg_catalog."default",
    post_id uuid,
    CONSTRAINT image_pkey PRIMARY KEY (image_id),
    CONSTRAINT post_id FOREIGN KEY (post_id)
        REFERENCES public.posts (post_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.image
    OWNER to postgres;

-- need to add last_message constraint
CREATE TABLE public.rooms
(
    room_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    post_id uuid NOT NULL,
    last_message uuid,
    PRIMARY KEY (room_id),
    CONSTRAINT post_id FOREIGN KEY (post_id)
        REFERENCES public.posts (post_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

-- room members table
CREATE TABLE public.roommembers
(
    id serial,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT room_id FOREIGN KEY (room_id)
        REFERENCES public.rooms (room_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT uesr_id FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS public.roommembers
    OWNER to postgres;

-- messages table
CREATE TABLE public.messages
(
    message_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content character varying(500) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    PRIMARY KEY (message_id),
    CONSTRAINT room_id FOREIGN KEY (room_id)
        REFERENCES public.rooms (room_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT user_id FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS public.messages
    OWNER to postgres;