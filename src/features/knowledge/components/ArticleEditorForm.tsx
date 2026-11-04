import type { ReactNode } from 'react';
import { Button, Form, Input, Select, Space, Typography } from 'antd';
import type { FormInstance } from 'antd';
import type { ArticleDraftPayload } from '../model/knowledge.types';
import { ARTICLE_TAGS_MAX, ARTICLE_TITLE_MAX, articleRules, normalizeTags } from '../validation/articleRules';

interface ArticleEditorFormProps {
  form: FormInstance<ArticleDraftPayload>;
  initialValues: ArticleDraftPayload;
  pending: boolean;
  onSubmit: (payload: ArticleDraftPayload) => void;
  onCancel: () => void;
  /** Shown beside the buttons, e.g. when the draft was last saved. */
  status?: ReactNode;
}

/** Title, tags and Markdown content of a draft, checked like the backend Article domain. */
export function ArticleEditorForm({ form, initialValues, pending, onSubmit, onCancel, status }: ArticleEditorFormProps) {
  return (
    <Form<ArticleDraftPayload>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      disabled={pending}
      onFinish={(values) => onSubmit({ title: values.title.trim(), content: values.content.trim(), tags: normalizeTags(values.tags) })}
    >
      <Form.Item name="title" label={<span style={{ fontWeight: 600 }}>Tiêu đề</span>} rules={articleRules.title}>
        <Input placeholder="Ví dụ: Cách kết nối VPN khi làm việc từ xa" maxLength={ARTICLE_TITLE_MAX} showCount />
      </Form.Item>

      {/* Shown as the backend will store them: lower case, without duplicates. */}
      <Form.Item
        name="tags"
        label={<span style={{ fontWeight: 600 }}>Tags</span>}
        rules={articleRules.tags}
        normalize={(value: unknown) => (Array.isArray(value) ? normalizeTags(value.filter((tag): tag is string => typeof tag === 'string')) : [])}
        extra={`Nhập tag rồi nhấn Enter hoặc dấu phẩy; tối đa ${ARTICLE_TAGS_MAX} tag, mỗi tag tối đa 50 ký tự.`}
      >
        <Select mode="tags" aria-label="Tags" virtual={false} tokenSeparators={[',']} suffixIcon={null} notFoundContent={null} placeholder="vpn, mat-khau" />
      </Form.Item>

      <Form.Item
        name="content"
        label={<span style={{ fontWeight: 600 }}>Nội dung (Markdown)</span>}
        rules={articleRules.content}
        extra="Viết bằng Markdown: # tiêu đề, **đậm**, - danh sách, [liên kết](https://…)."
      >
        <Input.TextArea
          aria-label="Nội dung"
          autoSize={{ minRows: 12, maxRows: 30 }}
          placeholder="## Triệu chứng&#10;&#10;Mô tả lỗi người dùng gặp...&#10;&#10;## Cách xử lý&#10;&#10;1. ..."
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
        />
      </Form.Item>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{status}</Typography.Text>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={pending} style={{ borderRadius: 6, minWidth: 120 }}>
            Lưu nháp
          </Button>
        </Space>
      </div>
    </Form>
  );
}
