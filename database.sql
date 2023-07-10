-- creating posts table in pawmart table

CREATE TABLE public.posts
(
 
)
;

ALTER TABLE IF EXISTS public.posts
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