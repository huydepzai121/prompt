# augprompt

CLI tool để copy tất cả Augment AI prompts vào dự án một cách đơn giản (mặc định với --force).

## Cài đặt

```bash
npm install -g augprompt
```

Hoặc sử dụng npx mà không cần cài đặt global:

```bash
npx augprompt
```

## Sử dụng

### Copy tất cả prompts (Đơn giản nhất)

Chỉ cần gõ một lệnh để copy tất cả Augment AI prompts vào thư mục `.augment/rules/` (tự động ghi đè):

```bash
augprompt
```

### Xem danh sách prompts có sẵn

```bash
augprompt --list
```

Hiển thị danh sách tất cả prompts có sẵn với mô tả ngắn gọn.

## Options

| Option | Mô tả |
|--------|-------|
| `-l, --list` | Hiển thị danh sách tất cả prompts có sẵn |
| `-h, --help` | Hiển thị help |
| `-V, --version` | Hiển thị version |

**Lưu ý**: Lệnh `augprompt` mặc định sẽ copy tất cả prompts với `--force` (ghi đè tự động).

## Prompts có sẵn

Package này bao gồm các Augment AI prompts sau:

- **analyze** - Project analysis consultant chuyên phân tích và đưa ra hướng dẫn chiến lược
- **bugfinder** - Agent chuyên tìm và phân tích bugs
- **cat** - Agent hỗ trợ categorization và classification
- **commit** - Git assistant cho commit messages
- **deepdive** - Agent phân tích sâu technical issues
- **en** - English language processing agent
- **gitlabreview** - GitLab merge request review specialist
- **how** - How-to guide generation agent
- **init** - Atlas repository documentation agent
- **plan** - August specification-driven development agent
- **recheck** - Code verification specialist
- **research** - Elite research agent
- **story** - User story creation expert

## Cách hoạt động

1. **Tự động tạo thư mục**: Nếu thư mục `.augment/rules/` chưa tồn tại, tool sẽ tự động tạo
2. **Copy tất cả prompts**: Mặc định copy tất cả prompts với force=true (ghi đè tự động)
3. **Báo cáo chi tiết**: Hiển thị số lượng files đã copy thành công

## Ví dụ

### Setup prompts cho dự án mới

```bash
cd my-project
augprompt
```

### Xem có prompts nào

```bash
augprompt --list
```

### Update tất cả prompts

```bash
augprompt
```

## Yêu cầu hệ thống

- Node.js >= 14.0.0
- npm hoặc yarn

## Development

### Clone repository

```bash
git clone <repository-url>
cd augprompt
npm install
```

### Test local

```bash
node bin/augprompt.js --list
```

### Build và publish

```bash
npm run lint
npm run build
npm publish
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
