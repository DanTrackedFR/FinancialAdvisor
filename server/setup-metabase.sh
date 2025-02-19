#!/bin/bash

# Pull the latest Metabase image
docker pull metabase/metabase:latest

# Start Metabase container
docker run -d -p 3001:3000 \
  --name metabase \
  -e "MB_DB_TYPE=postgres" \
  -e "MB_DB_DBNAME=$PGDATABASE" \
  -e "MB_DB_PORT=$PGPORT" \
  -e "MB_DB_USER=$PGUSER" \
  -e "MB_DB_PASS=$PGPASSWORD" \
  -e "MB_DB_HOST=$PGHOST" \
  metabase/metabase
