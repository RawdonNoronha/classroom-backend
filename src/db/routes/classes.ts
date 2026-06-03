import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { classes, subjects, user, departments } from "../schema";
import { db } from "..";

const router = express.Router();

//Get all classes with optional search, filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { search, subject, teacher, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Number(limit) || 10);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(or(
                ilike(classes.name, `%${search}%`),
                ilike(classes.inviteCode, `%${search}%`)
            ));
        }

        if (subject) {
            filterConditions.push(eq(subjects.name, String(subject)));
        }

        if (teacher) {
            filterConditions.push(eq(user.name, String(teacher)));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResults = await db
            .select({ count: sql<number>`count(*)` })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause);

        const total = Number(countResults[0]?.count) || 0;

        const classesList = await db
            .select({
                ...getTableColumns(classes),
                subject: { ...getTableColumns(subjects) },
                teacher: { ...getTableColumns(user) }
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total,
                totalPages: Math.ceil(total / limitPerPage)
            }
        });
    }
    catch (e) {
        console.error('GET /classes error:', e);
        res.status(500).json({ error: 'Failed to get classes' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, teacherId, subjectId, capacity, description, status, bannerUrl, bannerCldPubId } = req.body;

        const [createdClass] = await db
            .insert(classes)
            .values({ ...req.body, inviteCode: Math.random().toString(36).substring(2, 9), schedules: [] })
            .returning({ id: classes.id });

        if (!createdClass) throw Error;

        res.status(201).json({ data: createdClass })
    }
    catch (e) {
        console.error('POST /classes error', e);
        res.status(500).json({ error: e })
    }
})

//Get class details with teacher, subject and department info
router.get('/:id', async (req, res) => {
    const classId = Number(req.params.id);

    if (!Number.isFinite(classId)) return res.status(400).json({ error: 'No Class Found' });

    const [classDetails] = await db
        .select({
            ...getTableColumns(classes),
            subject: { ...getTableColumns(subjects) },
            department: { ...getTableColumns(departments) },
            teacher: { ...getTableColumns(user) }
        })
        .from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(classes.id, classId));

    if (!classDetails) return res.status(404).json({ error: 'No Class Found' });

    res.status(200).json({ data: classDetails });
})

export default router;
