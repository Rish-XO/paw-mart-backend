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

    