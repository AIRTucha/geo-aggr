import { injectable } from 'inversify'
import 'reflect-metadata'

import { knex } from 'knex'
import { DBLink } from '../../core/apis/DBLink'
import { DBPoint } from '../../core/models'

function portNumber() {
    try {
        return parseInt(process.env.POSTGRES_PORT!)
    } catch {
        return 5432
    }
}

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.POSTGRES_HOST ?? '178.162.201.245',
        port: portNumber(),
        database: process.env.POSTGRES_DB ?? 'nekto_bot',
        user: process.env.POSTGRES_PASSWORD ?? 'nekto_bot',
        password: process.env.POSTGRES_PASSWORD ?? '8c?u-nb7Sa',
    }
})

@injectable()
export class SQLDBLink implements DBLink {
    async createUser(id: string, time: string): Promise<void> {
        const usersWithId = (await db('bot_user').select('id').where({ id }))
        if (usersWithId.length === 0) {
            await db('bot_user').insert({
                id,
                created: time,
                updated: time,
                chat_id: id,
                chat_name: `test_data_source-${id}`,
                is_trusted: false,
                is_banned: false,
                city_id: 2,
                city_name_other: null,
                last_message_time: null,
                karma: 0,
                last_location_time: time,
                lat: Math.random() * 50,
                lng: Math.random() * 50,
            })
        }
    }
    async createPoint(
        userId: string,
        time: string,
        risk: number,
        lat: number,
        lng: number
    ): Promise<void> {
        try {
            await db('bot_georating').insert({
                user_id: userId,
                created: time,
                updated: time,
                rating: risk,
                lat: lat,
                lng: lng,
                is_processed: false
            })
        } catch (e) {
            console.error(e)
        }
    }
    async getPoints(time: number): Promise<DBPoint[]> {
        return db('bot_georating')
            .where(
                'created',
                '>',
                new Date(time).toISOString()
            )
    }
    async updateKarma(userId: string, karmaDelta: number): Promise<void> {
        const newKarma = (await this.getKarma(userId)) - karmaDelta
        await db('bot_user')
            .where('id', '=', userId)
            .update({ karma: newKarma })
    }
    async getKarma(id: string): Promise<number> {
        return (
            await db('bot_user')
                .select('karma')
                .where('id', '=', id)
        )
            .map(a => a)[0].karma
    }
    markProcessed(pointId: string): Promise<void> {
        return db('bot_georating')
            .where('id', '=', pointId)
            .update({ is_processed: true })
    }
}
