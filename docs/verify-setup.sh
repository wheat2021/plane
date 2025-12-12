#!/bin/bash

###############################################################################
# Plane Docker 环境验证脚本
#
# 功能：验证 Docker Compose 环境是否正确配置
# 使用：bash docs/verify-setup.sh
# 日期：2025-12-12
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0
WARN=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Plane Docker 环境验证脚本 v1.0                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# 检查函数
###############################################################################

check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARN++))
}

section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

###############################################################################
# 1. 检查必需的命令
###############################################################################

section "检查必需的命令"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    check_pass "Docker 已安装 (版本: $DOCKER_VERSION)"
else
    check_fail "Docker 未安装"
fi

if command -v docker compose &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    check_pass "Docker Compose 已安装 (版本: $COMPOSE_VERSION)"
else
    check_fail "Docker Compose 未安装"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    check_pass "pnpm 已安装 (版本: $PNPM_VERSION)"
else
    check_warn "pnpm 未安装（仅在本地开发时需要）"
fi

###############################################################################
# 2. 检查配置文件
###############################################################################

section "检查配置文件"

if [ -f ".env" ]; then
    check_pass ".env 文件存在"

    # 检查关键环境变量
    if grep -q "POSTGRES_USER" .env && grep -q "POSTGRES_PASSWORD" .env; then
        check_pass "数据库配置已设置"
    else
        check_fail "数据库配置缺失"
    fi

    if grep -q "REDIS_HOST" .env; then
        check_pass "Redis 配置已设置"
    else
        check_fail "Redis 配置缺失"
    fi
else
    check_fail ".env 文件不存在"
    echo "    提示: cp .env.example .env"
fi

if [ -f "apps/api/.env" ]; then
    check_pass "apps/api/.env 文件存在"
else
    check_warn "apps/api/.env 文件不存在"
    echo "    提示: cp apps/api/.env.example apps/api/.env"
fi

if [ -f "apps/live/.env" ]; then
    check_pass "apps/live/.env 文件存在"
else
    check_warn "apps/live/.env 文件不存在"
    echo "    提示: cp apps/live/.env.example apps/live/.env"
fi

###############################################################################
# 3. 检查关键文件修复状态
###############################################################################

section "检查关键文件修复状态"

# 检查 PostCSS 配置
if [ -f "packages/tailwind-config/postcss.config.js" ]; then
    if grep -q "tailwindcss/nesting" packages/tailwind-config/postcss.config.js; then
        check_fail "PostCSS 配置未修复 (仍包含 tailwindcss/nesting)"
        echo "    参考: docs/Docker构建问题修复指南.md#1-postcss-配置修复"
    else
        check_pass "PostCSS 配置已修复"
    fi
fi

# 检查 Caddyfile
if [ -f "apps/proxy/Caddyfile.ce" ]; then
    # 检查全局配置块是否在开头
    FIRST_CHAR=$(head -1 apps/proxy/Caddyfile.ce | tr -d '[:space:]')
    if [ "$FIRST_CHAR" = "{" ]; then
        check_pass "Caddyfile 配置正确（全局块在开头）"
    else
        check_fail "Caddyfile 配置可能不正确"
        echo "    参考: docs/Docker构建问题修复指南.md#3-proxy-服务-caddyfile-修复"
    fi
fi

# 检查 docker-compose.yml 中的 live 服务配置
if grep -A 10 "container_name: plane-live" docker-compose.yml | grep -q "API_BASE_URL"; then
    check_pass "Live 服务环境变量已配置"
else
    check_fail "Live 服务环境变量未配置"
    echo "    参考: docs/Docker构建问题修复指南.md#2-live-服务环境变量配置"
fi

# 检查 docker-compose.yml 中的 proxy 服务配置
if grep -A 10 "container_name: proxy" docker-compose.yml | grep -q "SITE_ADDRESS"; then
    check_pass "Proxy 服务环境变量已配置"
else
    check_fail "Proxy 服务环境变量未配置"
    echo "    参考: docs/Docker构建问题修复指南.md#3-proxy-服务-caddyfile-修复"
fi

###############################################################################
# 4. 检查 Tailwind CSS 版本
###############################################################################

section "检查 Tailwind CSS 版本"

for app in admin web space; do
    if [ -f "apps/$app/package.json" ]; then
        VERSION=$(grep '"tailwindcss"' "apps/$app/package.json" | sed 's/.*"tailwindcss": "\^//' | sed 's/".*//')
        if [[ $VERSION == 3.* ]]; then
            check_pass "$app: Tailwind CSS v$VERSION (正确)"
        elif [[ $VERSION == 4.* ]]; then
            check_fail "$app: Tailwind CSS v$VERSION (应该是 v3.4.x)"
            echo "    修复: pnpm add tailwindcss@^3.4.18 --filter=$app -D"
        fi
    fi
done

###############################################################################
# 5. 检查 Docker 服务（如果已启动）
###############################################################################

section "检查 Docker 服务状态"

if docker compose ps &> /dev/null; then
    # 获取运行中的服务数量
    RUNNING=$(docker compose ps --format json 2>/dev/null | grep -c "Up" || echo "0")
    TOTAL=$(docker compose ps --format json 2>/dev/null | wc -l || echo "0")

    if [ "$RUNNING" -gt 0 ]; then
        check_pass "$RUNNING/$TOTAL 服务正在运行"

        # 检查关键服务
        for service in web admin api proxy plane-db plane-redis; do
            if docker compose ps $service 2>/dev/null | grep -q "Up"; then
                echo "    ✓ $service 正在运行"
            else
                echo "    ✗ $service 未运行"
            fi
        done

        # 测试服务访问（仅当 proxy 运行时）
        if docker compose ps proxy 2>/dev/null | grep -q "Up"; then
            section "测试服务访问"

            if curl -s -o /dev/null -w "%{http_code}" http://localhost:80/ | grep -q "200"; then
                check_pass "主应用可访问 (http://localhost:80/)"
            else
                check_fail "主应用无法访问"
            fi

            if curl -s -o /dev/null -w "%{http_code}" http://localhost:80/god-mode/ | grep -q "200"; then
                check_pass "管理后台可访问 (http://localhost:80/god-mode/)"
            else
                check_fail "管理后台无法访问"
            fi
        fi
    else
        check_warn "没有服务在运行"
        echo "    提示: docker compose up -d"
    fi
else
    check_warn "Docker Compose 未初始化"
    echo "    提示: docker compose up -d"
fi

###############################################################################
# 6. 磁盘空间检查
###############################################################################

section "检查磁盘空间"

AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
echo "  可用空间: $AVAILABLE"

# 检查 Docker 使用的空间
if command -v docker &> /dev/null; then
    DOCKER_SPACE=$(docker system df 2>/dev/null | grep "Total" | awk '{print $4}' || echo "未知")
    echo "  Docker 使用: $DOCKER_SPACE"
fi

###############################################################################
# 7. 总结
###############################################################################

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      验证结果汇总                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}✓ 通过:${NC} $PASS"
echo -e "  ${YELLOW}⚠ 警告:${NC} $WARN"
echo -e "  ${RED}✗ 失败:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 环境配置正确！可以开始使用。${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ 发现 $FAIL 个问题需要修复。${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "请参考以下文档进行修复："
    echo "  - docs/Docker构建问题修复指南.md"
    echo "  - docs/Docker快速参考.md"
    echo ""
    exit 1
fi
