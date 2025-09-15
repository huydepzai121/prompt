#!/usr/bin/env node

/**
 * CLI entry point cho augprompt package
 * Xử lý command line arguments và gọi core functions
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');
const {
  listAvailablePrompts,
  copyPrompts
} = require('../lib/index');

const program = new Command();

program
  .name('augprompt')
  .description('CLI tool để copy tất cả Augment AI prompts vào dự án (mặc định với --force)')
  .version(version);

// Default command - copy tất cả prompts với force=true mặc định
program
  .action(async () => {
    try {
      console.log(chalk.blue('🚀 Đang copy tất cả Augment AI prompts...'));
      // Mặc định sử dụng force=true để đơn giản hóa
      const result = await copyPrompts(true);

      if (result.success) {
        console.log(chalk.green(`✅ Đã copy thành công ${result.copiedCount} prompts vào .augment/rules/`));
        if (result.skippedCount > 0) {
          console.log(chalk.yellow(`⚠️  Đã ghi đè ${result.skippedCount} files đã tồn tại`));
        }
        console.log(chalk.gray('💡 Sử dụng "augprompt --list" để xem danh sách prompts có sẵn'));
      } else {
        console.log(chalk.red('❌ Có lỗi xảy ra khi copy prompts'));
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => console.log(chalk.red(`   ${error}`)));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Lỗi:'), error.message);
      process.exit(1);
    }
  });

// Option --list: hiển thị danh sách prompts có sẵn
program
  .option('-l, --list', 'hiển thị danh sách tất cả prompts có sẵn')
  .hook('preAction', async (thisCommand) => {
    if (thisCommand.opts().list) {
      try {
        const prompts = await listAvailablePrompts();
        console.log(chalk.blue('📋 Danh sách Augment AI prompts có sẵn:'));
        console.log('');
        prompts.forEach((prompt, index) => {
          console.log(`${index + 1}. ${chalk.green(prompt.name)} - ${prompt.description}`);
        });
        console.log('');
        console.log(chalk.gray(`Tổng cộng: ${prompts.length} prompts`));
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ Lỗi khi đọc danh sách prompts:'), error.message);
        process.exit(1);
      }
    }
  });



program.parse();
