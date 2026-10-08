import UnavailableAdminPanel from '../UnavailableAdminPanel';
export default function SafetyGuardrailPanel() {
  return <UnavailableAdminPanel title="Kiểm thử Prompt Injection & Safety Guardrails" description="Backend chưa có trình chạy kiểm thử an toàn. Chưa thể gửi prompt kiểm thử, đo độ trễ hoặc xác nhận khả năng chặn tấn công." actions={['Chạy kiểm thử an toàn']} />;
}
