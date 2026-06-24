export interface LegalDoc {
  id: string;
  title: { zh: string; en: string };
  lastUpdated: string;
  content: { zh: string; en: string };
}

export const legalDocuments: LegalDoc[] = [
  {
    id: "disclaimer",
    title: {
      zh: "免责声明与使用条款",
      en: "Disclaimer & Terms of Use",
    },
    lastUpdated: "2026-06-24",
    content: {
      zh: `## 1. 服务的性质与技术局限性

本网站（以下简称"本平台"）所提供的一切网络状态检测信息、数据、分析及报告（包括但不限于网络延迟、丢包率、路由追踪、域名系统解析、域名及互联网协议地址状态等），均基于自动化技术手段及特定网络节点在特定时间的实时采样。

> 鉴于互联网架构的复杂性、网络环境的瞬时波动、技术手段的固有局限性以及第三方服务商的数据变更，本平台明确提示：**所有检测结果及内容仅供参考，用户绝不应将其视为唯一的、绝对权威的或决定性的法律、技术或商业依据。**

## 2. 法律管辖与免责条款

本平台依据全球主要司法管辖区的相关法律法规，特此声明免除因信任本平台内容而导致的任何直接或间接损失的赔偿责任：

### 中国大陆
依据《中华人民共和国民法典》第一千一百九十四条及第一千一百九十七条、以及《网络安全法》之相关规定，本平台作为网络服务提供者，已尽到合理的注意义务。本平台不对因不可抗力、技术瓶颈或第三方干扰导致的数据滞后、偏差或错误承担民事侵权责任。

### 香港特别行政区
根据香港法例第71章《管制免责条款条例》第7条及第8条之精神，在法律允许的最大范围内，本平台明确免除因疏忽（非导致人身伤亡）或违约而引起的任何经济损失、利润损失或附带损失的法律责任。

### 台湾地区
依台湾地区《民法》关于不完全给付及侵权行为之规定，以及《消费者保护法》第十条之精神，本平台于提供服务时已明确告知当前技术之极限与潜在错误风险。使用者理解并同意自行承担因采用本平台数据而产生的商业与法律风险。

### 欧盟
根据欧盟《数字服务法》关于中介服务商免责的相关精神，以及《通用数据保护条例》关于技术客观局限性的认知，本平台不对因算法自动化检测带来的非主观恶意之数据误差承担法律责任。

### 美国
根据美国《联邦贸易委员会法》关于免责声明的指引，以及各州《统一商法典》关于"明示或暗示保证之免除"的规定，本平台明确声明：**不提供任何关于适销性或特定用途适用性的保证。本平台所有服务均按"现状"及"现有"基础提供。**

## 3. 最终用户责任

> 使用者在依赖本平台数据做出任何商业决策、技术调整、法律维权或索赔行为之前，应当且必须通过其他独立且具备法定资质的渠道进行交叉验证。任何因盲目信赖本平台数据而导致的系统瘫痪、商业损失、数据泄露或法律纠纷，本平台概不承担任何直接、间接、附带、惩罚性或衍生性的赔偿责任。

## 4. 条款修改与解释权

本平台保留随时修改本声明的权利。修改后的条款一经在网站公布即无限期生效。本声明的最终解释权在法律允许的范围内归本平台运营方所有。`,
      en: `## 1. Nature of Service & Technical Limitations

All network status detection information, data, analyses, and reports provided by this website (hereinafter "this Platform") — including but not limited to network latency, packet loss, traceroute, DNS resolution, and IP address status — are based on automated technical means and real-time sampling from specific network nodes at specific times.

> Given the complexity of Internet architecture, instantaneous fluctuations in network environments, inherent limitations of technical means, and data changes by third-party service providers, this Platform explicitly states: **all detection results and content are for reference only. Users should never regard them as the sole, absolutely authoritative, or definitive legal, technical, or commercial basis.**

## 2. Legal Jurisdiction & Disclaimer

This Platform hereby disclaims liability for any direct or indirect losses resulting from reliance on its content, in accordance with relevant laws and regulations of major global jurisdictions:

### Mainland China
In accordance with Articles 1194 and 1197 of the Civil Code of the People's Republic of China and relevant provisions of the Cybersecurity Law, this Platform, as a network service provider, has fulfilled its duty of reasonable care. This Platform shall not bear civil tort liability for data delays, deviations, or errors caused by force majeure, technical bottlenecks, or third-party interference.

### Hong Kong SAR
In the spirit of Sections 7 and 8 of the Control of Exemption Clauses Ordinance (Cap. 71), to the maximum extent permitted by law, this Platform expressly disclaims legal liability for any economic loss, loss of profit, or consequential damages arising from negligence (not resulting in personal injury) or breach of contract.

### Taiwan Region
In accordance with the provisions of the Civil Code regarding incomplete performance and tortious acts, and the spirit of Article 10 of the Consumer Protection Act, this Platform has clearly informed users of the current technical limitations and potential error risks. Users understand and agree to bear the commercial and legal risks arising from the use of this Platform's data.

### European Union
In accordance with the Digital Services Act regarding intermediary service provider immunity, and the General Data Protection Regulation regarding the objective technical limitations, this Platform shall not bear legal liability for non-intentional data errors resulting from automated algorithmic detection.

### United States
In accordance with the Federal Trade Commission Act guidelines on disclaimers, and the Uniform Commercial Code provisions on "exclusion of express or implied warranties," this Platform explicitly states: **no warranties of merchantability or fitness for a particular purpose are provided. All services are provided on an "as is" and "as available" basis.**

## 3. User Responsibilities

> Before making any business decisions, technical adjustments, legal claims, or litigation actions based on this Platform's data, users must and should cross-verify through other independent channels with legal qualifications. This Platform shall not bear any direct, indirect, incidental, punitive, or derivative compensation liability for system paralysis, business losses, data breaches, or legal disputes resulting from blind reliance on this Platform's data.

## 4. Amendment & Interpretation Rights

This Platform reserves the right to modify this statement at any time. Modified terms take effect indefinitely upon publication on the website. The final right of interpretation of this statement belongs to the Platform operator to the extent permitted by law.`,
    },
  },
  {
    id: "data-transfer",
    title: {
      zh: "数据跨境处理声明",
      en: "Cross-Border Data Transfer Statement",
    },
    lastUpdated: "2026-06-24",
    content: {
      zh: `## 第一条 声明之法律依据与适用范围

本声明系基于以下法律、法规及规范性文件之要求制定：

1. **中华人民共和国大陆地区**：《个人信息保护法》第三章（第三十八条至第四十三条）、《数据安全法》、《网络安全法》第三十七条，以及国家互联网信息办公室发布的《数据出境安全评估办法》《个人信息出境标准合同办法》等配套规章
2. **欧盟及欧洲经济区**：第2016/679号条例——《通用数据保护条例》（GDPR）第五章（第四十四条至第四十九条）
3. **美利坚合众国**：加州《消费者隐私法案》（CCPA）及其修订案《加州隐私权法案》（CPRA）
4. **中国香港特别行政区**：香港法例第486章《个人资料（私隐）条例》第33条
5. **中国台湾地区**："个人资料保护法"第二十一条及相关规定

## 第二条 数据跨境传输之定义

"数据跨境传输"是指我方将所收集、存储或处理的数据从其原始存储所在地传输至中华人民共和国大陆地区以外的国家、地区或司法管辖区之服务器、数据中心或第三方系统的行为。

## 第三条 跨境传输之数据类别

本平台在提供服务过程中可能涉及跨境传输的数据类别包括：

1. **个人身份信息**：姓名、电子邮箱地址、电话号码、用户账户凭证（加密存储）等
2. **设备与技术信息**：IP地址、设备标识符、操作系统类型及版本、浏览器类型及版本
3. **使用行为数据**：页面浏览记录、点击流数据、搜索查询记录
4. **交易与财务信息**：订单记录、支付方式（不包含完整银行卡号）
5. **通信与交互数据**：用户提交的咨询内容、反馈意见

## 第四条 跨境传输之目的与法律基础

1. **履行合同所必需**：为向您提供本平台之核心服务
2. **取得数据主体的单独同意**：在跨境传输前征得您的同意
3. **履行法定义务所必需**：为遵守适用法律法规
4. **公共利益或公共安全**

## 第五条 跨境传输之合规机制

### 中国大陆地区
依据《个保法》第三十八条及《数据出境安全评估办法》，采取以下一种或多种出境路径：
- 数据出境安全评估
- 个人信息出境标准合同备案
- 个人信息保护认证

### 欧盟GDPR项下
- 充分性认定（Adequacy Decision）
- 适当保障措施（SCCs、BCRs等）
- 特定情形之例外

### 美国法律框架
- 确保遵守CCPA/CPRA关于数据"出售"或"共享"之规定
- 提供"不得出售或分享我的个人信息"之选择退出机制

## 第六条 数据主体之权利

根据您所适用的司法管辖区之法律，您享有以下权利：

1. **知情权与访问权**：获知您的个人数据是否被跨境传输
2. **更正权**：要求更正不准确或不完整的个人数据
3. **删除权/被遗忘权**：在法定条件成就时要求删除
4. **限制处理权**：在特定情形下要求限制处理
5. **数据可携带权**：以结构化格式获取数据
6. **反对权**：在特定情形下反对数据处理
7. **撤回同意权**：随时撤回同意
8. **拒绝自动化决策权**：不受仅基于自动化处理所作出的决定的约束
9. **向监管机构投诉的权利**

## 第七条 数据安全措施

1. **传输加密**：采用TLS 1.2及以上版本
2. **存储加密**：采用AES-256等加密算法
3. **访问控制**：实施最小权限原则与多因素认证
4. **日志与审计**：全面的日志记录与定期审计
5. **数据去标识化与匿名化**
6. **安全评估与应急响应**

## 第八条 未成年人数据之特殊保护

本平台原则上不面向未满十四周岁的未成年人提供服务。如发现已收集未成年人个人数据，将立即停止处理并删除。

## 第九条 本声明之修订

我方保留随时修订本声明的权利。重大修订将以显著通知方式告知数据主体。`,
      en: `## Article 1 Legal Basis & Scope

This statement is formulated based on the following laws and regulations:

1. **Mainland China**: Personal Information Protection Law (Articles 38-43), Data Security Law, Cybersecurity Law (Article 37), and related regulations
2. **EU/EEA**: General Data Protection Regulation (GDPR), Chapter V (Articles 44-49)
3. **United States**: California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA)
4. **Hong Kong SAR**: Personal Data (Privacy) Ordinance, Section 33
5. **Taiwan Region**: Personal Data Protection Act, Article 21

## Article 2 Definition of Cross-Border Data Transfer

"Cross-border data transfer" refers to the transmission of collected, stored, or processed data from its original storage location to servers, data centers, or third-party systems outside mainland China.

## Article 3 Categories of Transferred Data

1. **Personal Identity Information**: Name, email, phone number, encrypted credentials
2. **Device & Technical Information**: IP address, device identifiers, OS/browser type
3. **Usage Behavioral Data**: Page views, clickstream data, search queries
4. **Transaction & Financial Information**: Order records, payment methods
5. **Communication & Interaction Data**: User inquiries and feedback

## Article 4 Purpose & Legal Basis

1. **Contractual Necessity**: To provide core platform services
2. **Separate Consent**: With your prior consent before transfer
3. **Legal Obligation**: To comply with applicable laws
4. **Public Interest or Public Safety**

## Article 5 Compliance Mechanisms

### Mainland China
- Data export security assessment
- Standard contract filing
- Personal information protection certification

### EU GDPR
- Adequacy decisions
- Appropriate safeguards (SCCs, BCRs)
- Specific derogations

### US Framework
- Compliance with CCPA/CPRA requirements
- Opt-out mechanism for data "sale" or "sharing"

## Article 6 Data Subject Rights

1. **Right to Information & Access**
2. **Right to Rectification**
3. **Right to Erasure / Right to be Forgotten**
4. **Right to Restrict Processing**
5. **Right to Data Portability**
6. **Right to Object**
7. **Right to Withdraw Consent**
8. **Right Against Automated Decision-Making**
9. **Right to Lodge a Complaint**

## Article 7 Data Security Measures

1. **Transmission Encryption**: TLS 1.2+
2. **Storage Encryption**: AES-256
3. **Access Control**: Least privilege & MFA
4. **Logging & Audit**: Comprehensive logging
5. **Data De-identification & Anonymization**
6. **Security Assessment & Incident Response**

## Article 8 Protection of Minor Data

This Platform does not knowingly provide services to minors under 14 years of age. Any collected minor data will be immediately processed and deleted.

## Article 9 Amendments

We reserve the right to amend this statement at any time. Major amendments will be notified prominently.`,
    },
  },
  {
    id: "country-flag",
    title: {
      zh: "关于国家地区标识符的法律声明",
      en: "Legal Statement on Country/Region Identifiers",
    },
    lastUpdated: "2026-06-24",
    content: {
      zh: `## 技术实现说明

本服务所呈现的国家/地区标识符（emoji）系基于国际标准化组织（ISO）制定的ISO/IEC 7064:1983及**ISO 3166-1 alpha-2**国际标准，通过技术性算法自动生成的纯功能性标识。其生成机制严格遵循Unicode Consortium发布的区域指示符号（Regional Indicator Symbols）技术规范。

## 法律声明

本服务对任何国家/地区标识符的呈现均不构成《维也纳条约法公约》第18条所规定的"事实承认"或"法律承认"，亦不体现《国际法原则宣言》所确立的主权平等原则之任何例外情形。

> 所有地理信息数据均源自Cloudflare提供的GeoIP服务。依据《联合国宪章》第二条所确立的主权平等原则，本服务提供者对数据源的准确性、完整性或政治含义不承担任何明示或默示的保证责任。

## 合规依据

本服务严格遵循以下法律法规及技术标准：

- 《中华人民共和国网络安全法》第二十三条
- 《数据安全法》第二十一条
- 《个人信息保护法》第五十一条
- IETF RFC 7940 等技术标准

## 用途声明

所提供的技术标识仅用于以下非政治性技术用途：

- 网络性能优化
- 安全分析
- 用户体验提升

**不涉及任何领土主权、政治地位或国际关系的表达。**

## 免责条款

依据《国际法院规约》第三十八条所确认的国际法渊源，本服务尊重联合国大会第2625(XXV)号决议确立的"关于各国依联合国宪章建立友好关系及合作之国际法原则宣言"，不参与、不评论、不承认任何存在争议的领土主张。

> 用户应明确理解并同意，本服务的技术实现属于《世界贸易组织与贸易有关的知识产权协定》（TRIPS）第10条所规定的"技术过程"范畴，不应被解释为对任何政治争议的立场表达或事实确认。本免责声明构成服务使用协议的不可分割组成部分。`,
      en: `## Technical Implementation

The country/region identifiers (emoji) presented by this service are generated through technical algorithms based on ISO/IEC 7064:1983 and **ISO 3166-1 alpha-2** international standards. The generation mechanism strictly follows the Regional Indicator Symbols technical specification published by the Unicode Consortium.

## Legal Statement

The presentation of any country/region identifier by this service does not constitute "de facto recognition" or "de jure recognition" as defined in Article 18 of the Vienna Convention on the Law of Treaties, nor does it represent any exception to the principle of sovereign equality established in the Declaration on Principles of International Law.

> All geographic information data is sourced from Cloudflare's GeoIP service. In accordance with the principle of sovereign equality established in Article 2 of the United Nations Charter, the service provider assumes no express or implied warranty responsibility for the accuracy, completeness, or political implications of the data source.

## Compliance Basis

This service strictly complies with the following laws, regulations, and technical standards:

- Cybersecurity Law of the PRC, Article 23
- Data Security Law, Article 21
- Personal Information Protection Law, Article 51
- IETF RFC 7940 and other technical standards

## Purpose Statement

The technical identifiers provided are used exclusively for the following non-political technical purposes:

- Network performance optimization
- Security analysis
- User experience enhancement

**They do not involve the expression of any territorial sovereignty, political status, or international relations.**

## Disclaimer

In accordance with the sources of international law confirmed in Article 38 of the Statute of the International Court of Justice, this service respects the "Declaration on Principles of International Law concerning Friendly Relations and Co-operation among States in accordance with the Charter of the United Nations" established by UN General Assembly Resolution 2625 (XXV), and does not participate in, comment on, or recognize any disputed territorial claims.

> Users should clearly understand and agree that the technical implementation of this service falls within the scope of "technical processes" as defined in Article 10 of the WTO Agreement on Trade-Related Aspects of Intellectual Property Rights (TRIPS), and should not be interpreted as a stance expression or factual confirmation regarding any political disputes. This disclaimer constitutes an integral part of the Terms of Service.`,
    },
  },
];
