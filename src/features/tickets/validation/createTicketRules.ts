import type { Rule } from 'antd/es/form';

export const createTicketRules = {
  title: [{ required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề.' }, { max: 100, message: 'Tiêu đề tối đa 100 ký tự.' }],
  categoryId: [{ required: true, message: 'Vui lòng chọn danh mục.' }],
  description: [{ required: true, whitespace: true, message: 'Vui lòng nhập mô tả.' }, {
    validator: (_, value: unknown) => typeof value === 'string' && value.trim().length >= 10
      ? Promise.resolve() : Promise.reject(new Error('Mô tả cần ít nhất 10 ký tự.')),
  }],
} satisfies Record<string, Rule[]>;
