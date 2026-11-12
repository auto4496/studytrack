# UI wording specification and verification

12 November 2026. Owner A / auto4496; reviewer B / Datakung. The user approved both surveyed wording lists before implementation. Base: accepted staging `86b0b3e222b364a7ad4e2ea2fae20ed7148073b2`. This is a UI copy update; implementation review and release remain pending.

## Approved wording

| Existing text | Agreed display text |
| --- | --- |
| แม่แบบกิจกรรม / แม่แบบ | Activity Templates for collection navigation/headings; Template in Thai sentences, create actions and empty states |
| สร้างแม่แบบ | สร้าง Template |
| ผู้ดูแลแม่แบบ | Program Manager |
| กำลังทำ / สิ้นสุดแล้ว | Active / Archived, for goal status labels |
| กิจกรรมที่อยากทำ | กิจกรรมการอ่าน |
| ช่วงเวลาที่บันทึกได้ | เวลาอ่านขั้นต่ำ–สูงสุด |
| กำลังอ่านความคืบหน้า… | กำลังโหลดผลการอ่าน… |
| บรรลุเป้าหมายแล้ว | อ่านครบเป้าหมายแล้ว |
| หยุดเป้าหมาย | หยุดติดตามเป้าหมาย; related confirmation/help/success text uses the same verb |
| ปิดใช้กิจกรรม | ปิดรับเป้าหมายใหม่; related confirmation/cancel/success text follows the same meaning |
| เวลาต่ำสุด / เวลาสูงสุด | เวลาอ่านขั้นต่ำ / เวลาอ่านสูงสุด |
| เป้าหมายต่อวัน / เป้าหมายรายวัน | เป้าหมายรายวัน throughout the UI |
| หน่วยกิจกรรม | หน่วยเวลา |
| เริ่มต้นได้ดีแล้ว | ยังไม่ครบเป้าหมาย, for a saved below-target daily result |
| ยังไม่ได้บันทึกวันที่เลือก | ยังไม่มีบันทึกสำหรับวันที่เลือก |
| อ่านสถานะล่าสุดแล้ว กรุณาตรวจข้อมูลก่อนส่งใหม่ | โหลดข้อมูลล่าสุดแล้ว กรุณาตรวจสอบก่อนลองอีกครั้ง |
| ปิดใช้แล้ว | Inactive, for a deactivated template |
| รวมแม่แบบที่ปิดใช้ | แสดงรายการที่ปิดใช้ด้วย; still includes both active and inactive templates |
| พื้นที่เล็ก ๆ สำหรับเป้าหมายที่สำคัญ | ติดตามการอ่านในแต่ละวัน |

Contextual variants of Template navigation, empty states and helper text use the same glossary. Participant activity labels and ordinary Thai actions remain Thai. The account-provisioning note's generic ผู้ดูแล is not renamed to Program Manager: that app role does not create accounts. User-entered titles/descriptions are not translated.

## Meaning and implementation boundaries

- Active/Archived name the existing goal status; Inactive names an existing template flag. These are display labels, not new stored values or a change to role/status codes.
- Stopping retains the inclusive end date/history and cannot reopen the goal. Deactivation closes new-goal creation while existing goals remain usable.
- A daily reading result can meet its target without archiving the goal. Result messages refer to the selected date and do not incorrectly say today for historical reads.
- APIs, request fields, calculations, validation bounds, authorization, persistence/schema and deployment settings retain their accepted behavior.
- Update existing browser selectors/text assertions, preserving scenario counts and business assertions. Redirect screenshots into this increment's evidence folder to preserve accepted Sprint1/F05 evidence.
- Build and run the existing desktop/mobile cases; inspect current screenshots and run required hosted CI. This copy-only change does not establish a new domain feature, independent human UAT or the assessed Lab7 changed-business-behavior exercise.

## Execution

Implementation and actual result/source links will be recorded after execution. No PASS is claimed by this specification checkpoint. Current UI images will belong to this increment; older reports/screenshots retain their original version and provenance.
