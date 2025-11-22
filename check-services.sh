#!/bin/bash

# Script para verificar que todos los servicios estén corriendo

echo "🔍 Verificando servicios de Platanus Hack 25..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local name=$1
    local url=$2

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
        echo -e "${GREEN}✓${NC} $name está corriendo en $url"
        return 0
    else
        echo -e "${RED}✗${NC} $name NO está disponible en $url"
        return 1
    fi
}

check_postgres() {
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL está corriendo"
        return 0
    else
        echo -e "${RED}✗${NC} PostgreSQL NO está disponible"
        return 1
    fi
}

# Verificar PostgreSQL
check_postgres

# Verificar APIs
check_service "API RAG Memory" "http://localhost:8000/docs"
check_service "API Speech to Text" "http://localhost:8001/docs"
check_service "API SST" "http://localhost:8002/docs"

# Verificar Frontends
check_service "Frontend Public Web" "http://localhost:3000"
check_service "Frontend Web App" "http://localhost:3001"

echo ""
echo -e "${YELLOW}💡 Tip:${NC} Para ver los logs de un servicio: docker-compose logs -f <servicio>"
echo -e "${YELLOW}💡 Tip:${NC} Para ver todos los servicios: docker-compose ps"
