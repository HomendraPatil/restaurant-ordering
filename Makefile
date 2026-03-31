.PHONY: help docker-build docker-up docker-down docker-logs docker-restart docker-clean docker-prod-build docker-prod-up docker-prod-down docker-db-migrate docker-db-push docker-db-seed docker-db-reset

# ============================================
# Docker Commands for Restaurant Ordering System
# ============================================

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
docker-build: ## Build all Docker images for development
	docker-compose build

docker-up: ## Start all services for development
	docker-compose up -d

docker-down: ## Stop all services
	docker-compose down

docker-logs: ## Show logs from all services
	docker-compose logs -f

docker-restart: ## Restart all services
	docker-compose restart

docker-clean: ## Clean up Docker resources (volumes, containers, images)
	docker-compose down -v --rmi local

docker-shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

docker-shell-customer: ## Open shell in customer container
	docker-compose exec customer sh

docker-shell-admin: ## Open shell in admin container
	docker-compose exec admin sh

# Database Commands
docker-db-migrate: ## Push schema to database (creates tables if not exist)
	docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push"

docker-db-push: ## Push schema to database (same as migrate)
	docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push"

docker-db-seed: ## Seed database with sample data
	docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db seed"

docker-db-reset: ## Reset database: delete all data and re-seed
	docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push && pnpm exec prisma db seed"

docker-db-studio: ## Open Prisma Studio
	docker-compose exec backend npx prisma studio

# Production Commands
docker-prod-build: ## Build all Docker images for production
	docker-compose -f docker-compose.prod.yml build

docker-prod-up: ## Start all services for production
	docker-compose -f docker-compose.prod.yml up -d

docker-prod-down: ## Stop all production services
	docker-compose -f docker-compose.prod.yml down

docker-prod-logs: ## Show logs from production services
	docker-compose -f docker-compose.prod.yml logs -f

docker-prod-restart: ## Restart all production services
	docker-compose -f docker-compose.prod.yml restart

# Utility Commands
docker-ps: ## Show running containers
	docker-compose ps

docker-network-inspect: ## Inspect the Docker network
	docker network inspect restaurant-ordering_restaurant-network

docker-volumes: ## List Docker volumes
	docker volume ls | grep restaurant

# Full Setup (first time)
setup: ## Full setup: build, migrate, seed
	make docker-prod-build
	make docker-prod-up
	sleep 15
	make docker-db-migrate
	make docker-db-seed

setup-dev: ## Full setup for development: build, migrate, seed
	make docker-build
	make docker-up
	sleep 15
	make docker-db-migrate
	make docker-db-seed
