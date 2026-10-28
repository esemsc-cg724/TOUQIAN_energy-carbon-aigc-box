// src/entities/energy-project/index.ts

/**
 * 能碳项目实体快照。
 *
 * 这里承接 PPT 风控报告生成所需的项目基础字段；未来接入真实项目库时，
 * 可以把 DEMO_ENERGY_PROJECTS 替换为 API 查询结果，页面和 feature 不需要改字段语义。
 */
export type EnergyProjectSnapshot = {
  address?: string | null;
  annualGeneration?: string | null;
  annualRevenue?: string | null;
  capacity?: string | null;
  city?: string | null;
  id: string;
  investment?: string | null;
  irr?: string | null;
  projectCode?: string | null;
  projectCompany?: string | null;
  projectName: string;
  roofArea?: string | null;
  roofOwner?: string | null;
  roofType?: string | null;
  userCompany?: string | null;
};

export const DEMO_ENERGY_PROJECTS: EnergyProjectSnapshot[] = [
  {
    id: 'suzhou-oulai',
    address: '苏州市吴中区',
    annualGeneration: '371.9 万度',
    annualRevenue: '238.4 万元',
    capacity: '3.5866',
    city: '苏州',
    investment: '1685.71',
    irr: '10.72',
    projectCode: 'ZNE-2024-SZ-028',
    projectCompany: '苏州欧莱光伏项目有限公司',
    projectName: '苏州欧莱屋顶分布式光伏项目',
    roofArea: '35866.09',
    roofOwner: '苏州欧莱厂区',
    roofType: '彩钢瓦 / 混凝土',
    userCompany: '苏州欧莱新能源配套有限公司',
  },
  {
    id: 'shanghai-lingang',
    address: '上海市浦东新区临港产业区',
    annualGeneration: '待测算',
    annualRevenue: '待测算',
    capacity: '待测算',
    city: '上海',
    investment: '待测算',
    irr: '待测算',
    projectCode: 'ZNE-2024-SH-016',
    projectCompany: '上海临港光伏项目有限公司',
    projectName: '上海临港厂房屋顶分布式光伏项目',
    roofArea: '28640.00',
    roofOwner: '临港厂区',
    roofType: '彩钢瓦',
    userCompany: '上海临港制造有限公司',
  },
  {
    id: 'fujian-park',
    address: '福建省泉州市晋江产业园',
    annualGeneration: '438.6 万度',
    annualRevenue: '261.8 万元',
    capacity: '4.2120',
    city: '泉州',
    investment: '1979.64',
    irr: '9.86',
    projectCode: 'ZNE-2024-FJ-009',
    projectCompany: '福建园区光伏项目有限公司',
    projectName: '福建园区分布式光伏示范项目',
    roofArea: '42120.50',
    roofOwner: '晋江产业园',
    roofType: '混凝土',
    userCompany: '福建园区能源科技有限公司',
  },
];

export function findEnergyProject(projectId: string): EnergyProjectSnapshot {
  return (
    DEMO_ENERGY_PROJECTS.find((project) => project.id === projectId) ?? DEMO_ENERGY_PROJECTS[0]
  );
}
