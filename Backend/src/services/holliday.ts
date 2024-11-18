import moment from "moment";

// Cache global de feriados por ano
const holidaysCache: { [year: number]: string[] } = {};

class Holiday {
  private readonly country: string = "BR"; // País fixo: Brasil

  // Feriados fixos no Brasil
  private static fixedHolidays = [
    "01-01", // Ano Novo
    "04-21", // Tiradentes
    "09-07", // Independência do Brasil
    "10-12", // Nossa Senhora Aparecida
    "11-02", // Finados
    "11-15", // Proclamação da República
    "12-25", // Natal
    "11-20", // Dia da Consciência Negra
    "12-31", // Reveillon
  ];

  // Calcula feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi)
  private static calculateMobileHolidays(year: number): string[] {
    const easter = this.calculateEasterSunday(year);

    const carnaval = moment(easter).subtract(47, "days").format("YYYY-MM-DD");
    const goodFriday = moment(easter).subtract(2, "days").format("YYYY-MM-DD");
    const corpusChristi = moment(easter).add(60, "days").format("YYYY-MM-DD");

    return [carnaval, goodFriday, corpusChristi];
  }

  // Algoritmo para calcular o domingo de Páscoa
  private static calculateEasterSunday(year: number): string {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return moment(`${year}-${month}-${day}`, "YYYY-M-D").format("YYYY-MM-DD");
  }

  // Obtém os feriados do ano, carregando do cache ou calculando
  private async getHolidays(year: number): Promise<string[]> {
    if (holidaysCache[year]) {
      return holidaysCache[year];
    }

    const fixedHolidays = Holiday.fixedHolidays.map((date) => `${year}-${date}`);
    const mobileHolidays = Holiday.calculateMobileHolidays(year);

    holidaysCache[year] = [...fixedHolidays, ...mobileHolidays];
    return holidaysCache[year];
  }

  // Calcula a data de vencimento ignorando finais de semana e feriados
  public async calculateDueDate(
    startDate: Date,
    slaDays: number
  ): Promise<Date> {
    const year = moment(startDate).year();
    const holidays = await this.getHolidays(year);

    let currentDate = moment(startDate);
    let daysAdded = 0;

    while (daysAdded < slaDays) {
      currentDate = currentDate.add(1, "days");

      if (
        ![6, 7].includes(currentDate.isoWeekday()) && // Ignora finais de semana
        !holidays.includes(currentDate.format("YYYY-MM-DD")) // Ignora feriados
      ) {
        daysAdded++;
      }
    }

    return currentDate.toDate();
  }
}

export default Holiday;
