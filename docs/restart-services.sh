#!/bin/bash

###############################################################################
# Plane 服务重启脚本
#
# 功能：根据修改的环境变量文件，智能重启相关服务
# 使用：bash docs/restart-services.sh [选项]
# 日期：2025-12-12
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

###############################################################################
# 显示帮助信息
###############################################################################

show_help() {
    cat << EOF
${BLUE}Plane 服务重启脚本${NC}

${CYAN}用法:${NC}
    bash docs/restart-services.sh [选项]

${CYAN}选项:${NC}
    -a, --all           重启所有服务
    -b, --backend       重启后端服务（API、Worker、Live）
    -f, --frontend      重新构建并重启前端服务（Web、Admin、Space）
    -i, --infrastructure 重启基础设施服务（DB、Redis、MinIO、RabbitMQ）
    -s, --service NAME  重启特定服务
    -h, --help          显示此帮助信息

${CYAN}示例:${NC}
    # 重启后端服务（修改 apps/api/.env 后）
    bash docs/restart-services.sh --backend

    # 重新构建前端（修改 apps/web/.env 后）
    bash docs/restart-services.sh --frontend

    # 重启特定服务
    bash docs/restart-services.sh --service api

    # 重启所有服务
    bash docs/restart-services.sh --all

${YELLOW}注意事项:${NC}
    - 前端服务修改环境变量需要重新构建
    - 后端服务只需重启即可
    - 确保在项目根目录运行此脚本

EOF
}

###############################################################################
# 服务重启函数
###############################################################################

restart_service() {
    local service=$1
    echo -e "${CYAN}► 重启 $service...${NC}"
    docker compose restart $service
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $service 重启成功${NC}"
    else
        echo -e "${RED}✗ $service 重启失败${NC}"
        exit 1
    fi
}

rebuild_and_restart() {
    local service=$1
    echo -e "${CYAN}► 重新构建 $service...${NC}"
    docker compose build $service
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $service 构建成功${NC}"
        echo -e "${CYAN}► 启动 $service...${NC}"
        docker compose up -d $service
        echo -e "${GREEN}✓ $service 启动成功${NC}"
    else
        echo -e "${RED}✗ $service 构建失败${NC}"
        exit 1
    fi
}

###############################################################################
# 重启后端服务
###############################################################################

restart_backend() {
    echo -e "${BLUE}━━━ 重启后端服务 ━━━${NC}"
    echo ""

    restart_service "api"
    restart_service "bgworker"
    restart_service "beatworker"
    restart_service "plane-live"

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 后端服务重启完成！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

###############################################################################
# 重新构建前端服务
###############################################################################

rebuild_frontend() {
    echo -e "${BLUE}━━━ 重新构建前端服务 ━━━${NC}"
    echo ""
    echo -e "${YELLOW}⚠ 注意: 前端服务构建可能需要 5-10 分钟${NC}"
    echo ""

    rebuild_and_restart "web"
    echo ""
    rebuild_and_restart "admin"
    echo ""
    rebuild_and_restart "space"

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 前端服务重建完成！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

###############################################################################
# 重启基础设施服务
###############################################################################

restart_infrastructure() {
    echo -e "${BLUE}━━━ 重启基础设施服务 ━━━${NC}"
    echo ""

    restart_service "plane-db"
    restart_service "plane-redis"
    restart_service "plane-minio"
    restart_service "plane-mq"
    restart_service "proxy"

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 基础设施服务重启完成！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

###############################################################################
# 重启所有服务
###############################################################################

restart_all() {
    echo -e "${BLUE}━━━ 重启所有服务 ━━━${NC}"
    echo ""
    echo -e "${YELLOW}⚠ 注意: 这将重启所有服务，可能需要 10-15 分钟${NC}"
    echo ""
    read -p "确认继续？(y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "操作已取消"
        exit 0
    fi

    echo ""
    restart_infrastructure
    echo ""
    restart_backend
    echo ""
    rebuild_frontend
}

###############################################################################
# 主程序
###############################################################################

main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Plane 服务重启工具 v1.0                         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 检查是否在项目根目录
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}✗ 错误: 请在项目根目录运行此脚本${NC}"
        exit 1
    fi

    # 解析参数
    case "$1" in
        -a|--all)
            restart_all
            ;;
        -b|--backend)
            restart_backend
            ;;
        -f|--frontend)
            rebuild_frontend
            ;;
        -i|--infrastructure)
            restart_infrastructure
            ;;
        -s|--service)
            if [ -z "$2" ]; then
                echo -e "${RED}✗ 错误: 请指定服务名称${NC}"
                echo "   用法: $0 --service <服务名>"
                exit 1
            fi
            restart_service "$2"
            ;;
        -h|--help|"")
            show_help
            ;;
        *)
            echo -e "${RED}✗ 未知选项: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac

    # 显示服务状态
    echo ""
    echo -e "${BLUE}━━━ 当前服务状态 ━━━${NC}"
    docker compose ps
}

# 运行主程序
main "$@"
