
cd ..
npm run build
aws s3 sync apps/web/shell/dist  s3://fer-oshiro-portfolio/shell   --delete --profile personal
aws s3 sync apps/web/home/dist   s3://fer-oshiro-portfolio/home    --delete --profile personal
aws s3 sync apps/web/blog/dist   s3://fer-oshiro-portfolio/blog    --delete --profile personal
aws s3 sync apps/web/resume/dist s3://fer-oshiro-portfolio/resume  --delete --profile personal
aws cloudfront create-invalidation  --distribution-id E1B4ILT6W9LUF4 --paths "/*" "/" --no-cli-pager --profile personal
