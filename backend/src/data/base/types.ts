export type Deletable =
  | {
      isDeleted: true
      deletedBy: string
      deletedAt: Date
    }
  | {
      isDeleted: false
    }

export interface Activatable {
  /** optional. default is true */
  isActive?: boolean
}

export interface WithDates {
  createdAt: Date
  updatedAt: Date
}

export type BaseCollection = WithDates &
  Activatable &
  Deletable & {
    createdBy: string
    updatedBy: string
  }
