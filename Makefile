# Pipeline Pulse — developer tasks
#
# `make seed` loads seed/seed.json (SQL) into the database. The schema itself is
# created by Liquibase when the API starts, so run the app (or `make migrate`)
# at least once before seeding.
#
# Connection settings default to the values in src/main/resources/application.yaml
# and can be overridden on the command line, e.g.:
#   make seed PGHOST=db PGUSER=pulse PGPASSWORD=secret

PGHOST     ?= localhost
PGPORT     ?= 5433
PGDATABASE ?= pulse
PGUSER     ?= postgres
PGPASSWORD ?= postgres
SEED_FILE  ?= seed/seed.sql

export PGPASSWORD

.PHONY: seed
seed: ## Load seed/seed.json into the database (idempotent)
	@echo "Seeding $(PGDATABASE) on $(PGHOST):$(PGPORT) as $(PGUSER)…"
	psql -h $(PGHOST) -p $(PGPORT) -U $(PGUSER) -d $(PGDATABASE) \
		-v ON_ERROR_STOP=1 -f $(SEED_FILE)
	@echo "Seed complete."

.PHONY: help
help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "} {printf "  %-12s %s\n", $$1, $$2}'
