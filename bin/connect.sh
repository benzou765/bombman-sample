#!/bin/sh

MACHINES=(`docker ps --format "{{.Names}}"`)

select NAME in ${MACHINES[@]}
do
    docker exec -it ${NAME} /bin/sh
    break
done
