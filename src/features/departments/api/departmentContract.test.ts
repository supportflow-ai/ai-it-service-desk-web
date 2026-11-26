import { describe, expect, it } from 'vitest';
import { readDepartment, readDepartments } from './departmentContract';

describe('departmentContract', () => {
  const validDepartment = {
    id: 'dep-hr',
    code: 'HR',
    name: 'Phòng Nhân sự',
    description: 'Quản lý nhân sự và tuyển dụng',
    managerId: 'user-hr-lead',
    managerName: 'Nguyễn Thị Nhân Sự',
    employeeCount: 15,
    status: 'active' as const,
  };

  it('reads a valid department', () => {
    expect(readDepartment(validDepartment)).toEqual(validDepartment);
  });

  it('throws on invalid department', () => {
    expect(() => readDepartment(null)).toThrow();
    expect(() => readDepartment({ id: 'dep' })).toThrow();
  });

  it('reads a list of departments', () => {
    expect(readDepartments([validDepartment])).toEqual([validDepartment]);
    expect(readDepartments([])).toEqual([]);
    expect(() => readDepartments('invalid')).toThrow();
  });
});
