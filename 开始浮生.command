#!/bin/bash
# 浮生 · 双击即玩（macOS）
# 为什么有这个脚本：npm start 必须在仓库目录里跑——用户在任意目录双击此文件都能玩，
# 已在运行则直接开门，首次使用自动装依赖+构建。
cd "$(dirname "$0")" || exit 1
URL="http://localhost:4310"

# 已在跑：直接开门（不重复起服务，避免端口冲突）
if curl -s -o /dev/null --max-time 1 "$URL/api/pulse"; then
  echo "浮生已在运行，开门。"
  open "$URL"
  exit 0
fi

echo "启动浮生……"
# 首次使用：装依赖 + 构建（有产物则跳过，秒开）
if [ ! -d node_modules ]; then
  echo "首次运行：安装依赖（约 1 分钟，仅此一次）……"
  npm install --no-audit --no-fund || { echo "依赖安装失败，请检查网络后重试"; read -r -p "按回车关闭"; exit 1; }
fi
if [ ! -f home/dist/index.html ] || [ ! -f worlds/fusheng/dist/index.html ]; then
  echo "构建产物缺失，先构建……"
  npm run build || { echo "构建失败"; read -r -p "按回车关闭"; exit 1; }
fi

npm start &
HUB_PID=$!
# 等端口就绪（最多 15 秒）
for _ in $(seq 1 30); do
  if curl -s -o /dev/null --max-time 1 "$URL/api/pulse"; then break; fi
  sleep 0.5
done
if curl -s -o /dev/null --max-time 1 "$URL/api/pulse"; then
  echo "浮生已就绪：$URL"
  open "$URL"
  # 窗口留着（hub 挂在本脚本下，关窗口即停服——「玩完关窗」最直觉）
  wait $HUB_PID
else
  echo "端口 4310 未就绪——可能被其他程序占用；可用 FUSHENG_PORT=其他端口 ./开始浮生.command"
  read -r -p "按回车关闭"
fi
