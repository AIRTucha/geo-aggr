import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, Signal } from '../../core/apis/DataInjection'

import { Telegraf, Markup } from 'telegraf'
import { Subject } from 'rxjs'
import { sampleID, Logger } from '../../utils'
import { GeoPoint, RawSample } from '../../core/models'


const logger = Logger('TgDataInjection ')

type Session = {
  state: State,
  loc?: GeoPoint,
  risk?: number,
  timestamp?: Date
}

type State = 'waiting for loc' | 'waiting for number' | 'waiting for confirmation' | 'Confirmed' | 'Subscribed'

@injectable()
export class TgDataInjection implements DataInjection {
  bot = new Telegraf('1667286177:AAEbRz5di9CqqwJcz8EDmyVAOTameSqqEtA')

  session = new Map<number, Session>()
  subject = new Subject<RawSample>();

  constructor() {
    this.bot.launch()

    //The bot will request new info every 20 mins

    setInterval(() => {
      for (const entry of this.session.entries()) {
        if (entry[1].timestamp && entry[1].timestamp < new Date(Date.now() - 1200000) && entry[1].state == 'Subscribed') {
          this.bot.telegram.sendMessage(entry[0], 'Просим вас поделиться информацией ещё раз. Также вы можете использовать команду /stop для отключения бота.', Markup
            .keyboard(['Старт'])
            .oneTime()
            .resize())
          entry[1].timestamp = new Date()
          logger(`User ${entry[0]} was prompted to send info again.`)
        }
      }
    }, 1000)


    this.bot.start((ctx) => {
      if (ctx.message) {
        this.session.set(ctx.message.from.id, { state: 'waiting for loc' })
        logger(`User ${ctx.message.from.id} started the bot`)
        ctx.reply('Приветствуем, это Аквадискобот. Нажмите СТАРТ, чтобы продолжить.', Markup
          .keyboard(['Старт'])
          .oneTime()
          .resize())
      }
    })

    this.bot.on('location', (ctx) => {
      if (ctx.message) {
        const session = this.session.get(ctx.message.from.id)

        if (session && session.state == 'waiting for loc') {
          session.loc = {
            lat: ctx.message.location.latitude,
            lng: ctx.message.location.longitude
          }
          session.state = 'waiting for number'
          ctx.reply('Шкала оценивания сотрудников полиции/ОМОН: \n 1: Незначительное количество, без задержаний \n 2: Среднее количество, без задержаний \n 3: Среднее количество, некоторых задерживают \n 4: Большое количество, среднее количество задержаний  \n 5: Очень много, массовые задержания ')
          ctx.reply('Введите номер 1-5, описывающий ситуацию в вашем местоположении', Markup.keyboard([['1', '2', '3', '4', '5'], ['Start again']]).oneTime().resize())
        }
        else ctx.reply('Неверный ввод')
      }
    })

    this.bot.on('text', (ctx) => {
      const risk = parseInt(ctx.message.text)
      const session = this.session.get(ctx.message.from.id)

      if (ctx.message.text == 'Старт' || ctx.message.text == 'Начать заново') {
        this.session.set(ctx.message.from.id, { state: 'waiting for loc' })
        const responses = ['Пожалуйста, поделитесь локацией']
        ctx.reply(responses[~~(Math.random() * responses.length)], Markup
          .keyboard(['Начать заново'])
          .oneTime()
          .resize())
      }

      else if (risk > 0 && risk <= 5 && session && session.state == 'waiting for number') {
        session.risk = parseInt(ctx.message.text)

        session.state = 'waiting for confirmation'
        ctx.reply('Отправить данные?', Markup.keyboard(['Отправить', 'Начать заново']).oneTime().resize())
      }

      else if (ctx.message.text == 'Отправить' && session && session.loc && session.risk && session.state == 'waiting for confirmation') {
        const { loc, risk } = session
        const id = ctx.message.from.id.toString()
        ctx.reply('Данные сохраняются..').then(() => {
          this.subject.next({
            lat: loc.lat,
            lng: loc.lng,
            date: Date.now(),
            id: sampleID(id, loc.lat, loc.lng),
            sourceId: id,
            risk,
          })
        })
        logger(`User ${ctx.message.from.id} has sent new data. Latitude:: ${loc.lat}, longitude: ${loc.lng}, risk: ${risk}`)
        session.state = 'Subscribed'
        session.timestamp = new Date()
        const responses = ['Благодарим за информацию.', 'Мы ценим ваше участие.']
        ctx.reply(responses[~~(Math.random() * responses.length)], Markup.keyboard(['/start']).oneTime().resize())
      }
      else ctx.reply('Неверный ввод')
    })

  }
  emit(signal: Signal, id: string): void {
    switch (signal) {
      case 'ALREADY_REPORTED_LOCATION':
        this.bot.telegram.sendMessage(id, 'Вы уже оценили это место, не так ли? Держите нас в курсе, но не так часто 🙂')
        break
      case 'TOO_HIGH_FREQUENCY':
        this.bot.telegram.sendMessage(id, 'Мы ценим ваше рвение, но оценка не будет учтена, сделайте небольшой перерыв.')
        break
      case 'ACCEPTED':
        this.bot.telegram.sendMessage(id, 'Спасибо!')
        break
      case 'INCONSISTENT_MOVEMENT':
        this.bot.telegram.sendMessage(id, 'Мы обнаружили отклонения от нормы в вашем передвижении за последние 15 минут. Пожалуйста, попробуйте позже!')
        break
    }
  }

  listen(): Observable<RawSample> {
    return this.subject
  }
}
