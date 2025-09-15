/**
 * Core logic cho augprompt package
 * Xử lý việc copy prompts từ package vào target directory
 */

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * Lấy đường dẫn tới thư mục prompts trong package
 * @returns {string} Đường dẫn tới thư mục prompts
 */
function getPromptsDirectory() {
  // Khi package được cài đặt, prompts sẽ ở trong node_modules/augprompt/prompts
  // Khi development, prompts sẽ ở trong ./prompts
  const packagePromptsDir = path.join(__dirname, '..', 'prompts');
  return packagePromptsDir;
}

/**
 * Lấy đường dẫn tới thư mục đích (.augment/rules)
 * @returns {string} Đường dẫn tới thư mục đích
 */
function getTargetDirectory() {
  return path.join(process.cwd(), '.augment', 'rules');
}

/**
 * Đọc và parse thông tin từ file prompt
 * @param {string} filePath - Đường dẫn tới file prompt
 * @returns {Object} Thông tin về prompt
 */
async function parsePromptFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const fileName = path.basename(filePath, '.md');

    // Tìm title từ dòng đầu tiên có # hoặc sử dụng filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : fileName;

    // Tìm description từ nhiều patterns khác nhau
    let description = 'Augment AI prompt';

    // Pattern 1: Tìm description field trong metadata
    const descFieldMatch = content.match(/^-\s*description:\s*(.+)$/m);
    if (descFieldMatch) {
      description = descFieldMatch[1].trim();
    } else {
      // Pattern 2: Tìm đoạn text sau Role: hoặc # Role
      const roleMatch = content.match(/(?:^#\s*Role:|^Role:)\s*(.+?)(?:\n\n|$)/s);
      if (roleMatch) {
        description = roleMatch[1].trim().replace(/\n/g, ' ');
      } else {
        // Pattern 3: Tìm đoạn đầu tiên sau title
        const firstParaMatch = content.match(/^#\s+.+?\n\n(.+?)(?:\n\n|$)/s);
        if (firstParaMatch) {
          description = firstParaMatch[1].trim().replace(/\n/g, ' ');
        }
      }
    }

    // Làm sạch description và giới hạn độ dài
    description = description.replace(/^[-*]\s*/, '').trim();
    if (description.length > 120) {
      description = description.substring(0, 120) + '...';
    }

    return {
      name: fileName,
      title,
      description,
      filePath
    };
  } catch {
    return {
      name: path.basename(filePath, '.md'),
      title: path.basename(filePath, '.md'),
      description: 'Augment AI prompt',
      filePath
    };
  }
}

/**
 * Lấy danh sách tất cả prompts có sẵn
 * @returns {Array} Danh sách prompts với thông tin chi tiết
 */
async function listAvailablePrompts() {
  const promptsDir = getPromptsDirectory();

  try {
    const files = await fs.readdir(promptsDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    const prompts = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(promptsDir, file);
        return await parsePromptFile(filePath);
      })
    );

    return prompts.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    throw new Error(`Không thể đọc thư mục prompts: ${error.message}`);
  }
}

/**
 * Kiểm tra và tạo thư mục đích nếu chưa tồn tại
 * @param {string} targetDir - Đường dẫn thư mục đích
 */
async function ensureTargetDirectory(targetDir) {
  try {
    await fs.ensureDir(targetDir);
  } catch (error) {
    throw new Error(`Không thể tạo thư mục ${targetDir}: ${error.message}`);
  }
}

/**
 * Hỏi user có muốn ghi đè file không
 * @param {string} fileName - Tên file
 * @returns {boolean} True nếu user muốn ghi đè
 */
async function askOverwrite(fileName) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'overwrite',
      message: `File ${chalk.yellow(fileName)} đã tồn tại. Bạn có muốn ghi đè không?`,
      default: false
    }
  ]);

  return answer.overwrite;
}

/**
 * Copy một file prompt từ source tới destination
 * @param {string} sourceFile - Đường dẫn file nguồn
 * @param {string} destFile - Đường dẫn file đích
 * @param {boolean} force - Có ghi đè tự động không
 * @returns {Object} Kết quả copy
 */
async function copyPromptFile(sourceFile, destFile, force = false) {
  try {
    const fileName = path.basename(destFile);

    // Kiểm tra file đã tồn tại
    const exists = await fs.pathExists(destFile);

    if (exists && !force) {
      const shouldOverwrite = await askOverwrite(fileName);
      if (!shouldOverwrite) {
        return { success: true, skipped: true, fileName };
      }
    }

    await fs.copy(sourceFile, destFile);
    return { success: true, copied: true, fileName };

  } catch (error) {
    return { success: false, error: error.message, fileName: path.basename(destFile) };
  }
}

/**
 * Copy tất cả prompts vào thư mục đích
 * @param {boolean} force - Có ghi đè tự động không
 * @returns {Object} Kết quả tổng hợp
 */
async function copyPrompts(force = false) {
  const targetDir = getTargetDirectory();

  try {
    // Đảm bảo thư mục đích tồn tại
    await ensureTargetDirectory(targetDir);

    // Lấy danh sách prompts
    const prompts = await listAvailablePrompts();

    let copiedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Copy từng file
    for (const prompt of prompts) {
      const destFile = path.join(targetDir, `${prompt.name}.md`);
      const result = await copyPromptFile(prompt.filePath, destFile, force);

      if (result.success) {
        if (result.copied) {
          copiedCount++;
        } else if (result.skipped) {
          skippedCount++;
        }
      } else {
        errors.push(`${result.fileName}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      copiedCount,
      skippedCount,
      errors,
      totalCount: prompts.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      copiedCount: 0,
      skippedCount: 0
    };
  }
}

/**
 * Copy các prompts được chọn
 * @param {Array} selectedPrompts - Danh sách tên prompts được chọn
 * @param {boolean} force - Có ghi đè tự động không
 * @returns {Object} Kết quả tổng hợp
 */
async function copySelectedPrompts(selectedPrompts, force = false) {
  const promptsDir = getPromptsDirectory();
  const targetDir = getTargetDirectory();

  try {
    // Đảm bảo thư mục đích tồn tại
    await ensureTargetDirectory(targetDir);

    let copiedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    const errors = [];

    // Copy từng file được chọn
    for (const promptName of selectedPrompts) {
      const sourceFile = path.join(promptsDir, `${promptName}.md`);
      const destFile = path.join(targetDir, `${promptName}.md`);

      // Kiểm tra file nguồn có tồn tại không
      const exists = await fs.pathExists(sourceFile);
      if (!exists) {
        notFoundCount++;
        errors.push(`Không tìm thấy prompt: ${promptName}`);
        continue;
      }

      const result = await copyPromptFile(sourceFile, destFile, force);

      if (result.success) {
        if (result.copied) {
          copiedCount++;
        } else if (result.skipped) {
          skippedCount++;
        }
      } else {
        errors.push(`${result.fileName}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      copiedCount,
      skippedCount,
      notFoundCount,
      errors,
      totalCount: selectedPrompts.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      copiedCount: 0,
      skippedCount: 0,
      notFoundCount: 0
    };
  }
}

module.exports = {
  listAvailablePrompts,
  copyPrompts,
  copySelectedPrompts,
  getPromptsDirectory,
  getTargetDirectory
};
