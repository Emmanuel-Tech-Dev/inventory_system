import utils from "./react-utilities";
import Settings from "./settings";
import { message, Image } from "antd";
const CustomFunctions = {
    myStyle(token) {
        const contentStyle = {
            color: token.colorTextTertiary,
            // backgroundColor: '#ebebeb',
            borderRadius: token.borderRadiusLG,
            border: `2px dashed ${token.colorBorder}`,
        };
        return { contentStyle };
    },
    async gradeQuery(queryBy = {}) {
        const res = await utils.requestWithReauth('post', `${Settings.backend}/get_grades_for_calc`, null, queryBy);        
        return res.results;
    },
    async calc(setRecords, setCalculatedValues, vals) {
        const records = await CustomFunctions.gradeQuery({ values: vals });
        if (!records) {
            return;
        }
        // const records = [
        //     { student_id: '10104040', grade: 'C', grade_points: 2.00, credit_hours: 3, credit_grade_point: 6.00, semester_id: 1, course_id: 'EDC116', course_name: 'PHILOSOPHY OF EDUCATION, SCHOOL CURRICULUM, SOCIAL CHANGE AND NATIONAL DEVELOPMENT', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'C+', grade_points: 2.50, credit_hours: 3, credit_grade_point: 7.50, semester_id: 1, course_id: 'GPD111', course_name: 'COMMUNICATION SKILLS I', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'C+', grade_points: 2.50, credit_hours: 3, credit_grade_point: 7.50, semester_id: 1, course_id: 'ITC111', course_name: 'INTRODUCTION TO PROGRAMMING', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'B', grade_points: 3.00, credit_hours: 3, credit_grade_point: 9.00, semester_id: 1, course_id: 'ITC112', course_name: 'LINEAR ALGEGRA AND CALCULUS', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'B', grade_points: 3.00, credit_hours: 3, credit_grade_point: 9.00, semester_id: 1, course_id: 'ITC113', course_name: 'PRINCIPLES OF ACCOUNTING', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'B', grade_points: 3.00, credit_hours: 3, credit_grade_point: 9.00, semester_id: 1, course_id: 'ITC114', course_name: 'FUNDAMENTALS OF INFORMATION TECHNOLOGY', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },

        //     { student_id: '10104040', grade: 'B', grade_points: 3.00, credit_hours: 3, credit_grade_point: 9.00, semester_id: 2, course_id: 'EDC122', course_name: 'EDUCATIONAL TECHNOLOGY', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'C+', grade_points: 2.50, credit_hours: 3, credit_grade_point: 7.50, semester_id: 2, course_id: 'GPD123DG', course_name: 'AFRICAN STUDIES (POPULATION GROWTH & DEVELOPMENT IN AFRICA)', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'B', grade_points: 3.00, credit_hours: 3, credit_grade_point: 9.00, semester_id: 2, course_id: 'ITC121', course_name: 'INFORMATION TECHNOLOGY TOOLS IN EDUCATION', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'B+', grade_points: 3.50, credit_hours: 3, credit_grade_point: 10.50, semester_id: 2, course_id: 'ITC122', course_name: 'JAVA PROGRAMMING', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'B', grade_points: 3.00, credit_hours: 3, credit_grade_point: 9.00, semester_id: 2, course_id: 'ITC123', course_name: 'COMPUTER ARCHITECTURE', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'A', grade_points: 4.00, credit_hours: 3, credit_grade_point: 12.00, semester_id: 2, course_id: 'ITC124', course_name: 'DIGITAL ELECTRONICS', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        //     { student_id: '10104040', grade: 'A', grade_points: 4.00, credit_hours: 3, credit_grade_point: 12.00, semester_id: 2, course_id: 'ITC125', course_name: 'DISCRETE MATHEMATICS', acad_year: '2022/2023', dob: '0000-00-00', program: 'program', student_name: 'Thompson', start_date: '2023-01-01', end_date: '2027-01-01', sex: 'Male', start_level: 100, end_level: 400 },
        // ];

        // let d = lastSem(records);
        // console.log(d);
        setRecords(records);
        const grouped = utils.groupBy(records, 'student_id');
        const subgroup = [];
        for (let key in grouped) {
            const b = utils.groupBy(grouped[key], 'semester_id');
            subgroup.push({ [key]: b });
        }
        
        //Each entry in the subgroup is one student with all of his/her details
        const details = subgroup?.map(v => {
            const entries = Object.entries(v)[0];
            const index_no = entries[0];
            const grades = entries[1];            
            let details = { CCR: 0, CGV: 0, CGPA: 0 };

            const std = {
                index_no,
                dob: new Date(utils.formatDate(grouped[index_no][0].dob)).toLocaleDateString(),
                program: grouped[index_no][0].program,
                student_name: `${grouped[index_no][0].fname || ''} ${grouped[index_no][0].lname || ''} ${grouped[index_no][0].mname || ''}`,
                period: `${grouped[index_no][0].start_date}/${grouped[index_no][0].end_date}`,
                sex: grouped[index_no][0].sex,
                startLevel: grouped[index_no][0].start_level,
                endLevel: grouped[index_no][0].end_level,
                semesters: {}
            };
            for (let semester in grades) {
                const semesterDetails = grades[semester];
                let semesterValues = { SCR: 0, SGP: 0, SGPA: 0, hasIC: 0, courses: [], acadYr: '' };
                semesterDetails?.forEach(sd => {
                    semesterValues.hasIC = sd.grade === 'IC' ? 1 : 0;
                    semesterValues.SCR += parseFloat(sd.credit_hours);
                    semesterValues.SGP += parseFloat(sd.credit_grade_point);
                    semesterValues.SGPA = parseFloat(parseFloat(semesterValues.SGP / semesterValues.SCR).toFixed(2));
                    semesterValues.acadYr = sd.acad_year;
                    semesterValues.courses.push({ course_id: sd.course_id, course_name: sd.course_name, credit: sd.credit_hours, grade: sd.grade, grade_point: sd.credit_grade_point, has_resat: sd.has_resat });
                });
                details.CCR += semesterValues.SCR;
                details.CGV += semesterValues.SGP;
                details.CGPA = parseFloat(parseFloat(details.CGV / details.CCR).toFixed(2));
                std['semesters'][semester] = { ...semesterValues, ...details };
            }
            return std;
        });
        setCalculatedValues(details);
    },
   
       
    async viewStudentBasicData(record, drawer, valuesStore) {
        let res = await utils.requestWithReauth('post', `${Settings.backend}/get_student_details`, null, { index_no: record.index_no });
        const details = res.result[0];
        const { Firstname, Lastname, Middlename, ApplicantID, Campus,
            Citizenship, CurrentSemesterName, Department, Gender, IndexNumber,
            Level, PersonalEmail, Program, Status, Stream, StudentType, Telephone, Title } = details;

        const d = valuesStore.getArrayObjectsValue('settings', 'prop', 'student_admission_data_endpoint');
        const emailSuffix = valuesStore.getArrayObjectsValue('settings', 'prop', 'student_mail_suffix');
        // console.log(d,details);
        // return;
        let res1 = await utils.requestWithReauth('post', d.value, null, { applicant_id: ApplicantID });
        const picPath = res1?.res?.filter(v => {
            if (v.lookup_item == 'picture' && v.item.toLowerCase() == 'path') {
                return v;
            }
        });

        drawer.setOpen(true);
        drawer.setPlacement('right');
        drawer.setClosable(false);
        drawer.setTitle(`Details of ${Lastname} ${IndexNumber}`);
        drawer.setWidth(520);

        const data = [
            ['Title', Title],
            ['First Name', Firstname],
            ['Last Name', Lastname],
            ['Middle Name', Middlename],
            ['Gender', Gender],
            ['Citizen Of', Citizenship],
            ['ApplicantID', ApplicantID],
            ['Index Number', IndexNumber],
            ['Program', Program],
            ['Session', Stream],
            ['Level', Level],
            ['Department', Department],
            ['Campus', Campus],
            ['Telephone', Telephone],
            ['Personal Email', PersonalEmail],
            ['Student Email', `${IndexNumber}@${emailSuffix.value}`],
            ['Student Type', StudentType],
            ['Status', Status],
        ];
        const table = utils.getTable([], data, 'w-100 table table-striped table-sm', '', '', 'fw-bold');
        const content = <div>
            {
                (picPath && picPath.length) ? <Image
                    width={200}
                    src={`https://application.aamusted.edu.gh/applicant/${picPath[0]?.value}`}
                />
                    :
                    <Image
                        fallback="data:image/png;base64,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"
                        width={200}
                    />
            }
            {table}
        </div>
        drawer.setContent(content);
        // setStudentViewLoading(false);
    },


}

export default CustomFunctions;