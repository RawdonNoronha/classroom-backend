import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../schema';
import { db } from '..';
import { count } from 'node:console';
import { off } from 'node:cluster';

const router = express.Router();

//Get all subjects with optional search, filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

        const offest = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(or(
                ilike(subjects.name, `%${search}%`),
                ilike(subjects.code, `%${search}%`)
            ))
        }
        if (department) {
            filterConditions.push(ilike(departments.name, `%${department}%`))
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResults = await db
            .select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResults[0]?.count ?? 0;

        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            departments: { ...getTableColumns(departments) }
        }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(whereClause)
        .orderBy(desc(subjects.createdAt))
        .limit(limitPerPage)
        .offset(offest);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                totalCount: totalCount,
                totalPages: Math.ceil(totalCount /limitPerPage)
            }
        })
    }
    catch (e) {
        console.error('GET /subjects error:', e);
        res.status(500).json({ error: 'Failed to get subjects' });
    }
})

export default router;