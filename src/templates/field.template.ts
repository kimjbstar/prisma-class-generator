export const FIELD_TEMPLATE = `	#!{DECORATORS}
	#!{NAME}: #!{TYPE} #!{DEFAULT}
`
export const FIELD_GETTER_ONE_TEMPLATE = `
  protected _#!{NAME}: #!{TYPE} | null = null
	async #!{NAME}(): Promise<#!{TYPE} | null> {
	if(this._#!{NAME} === null){
      const dbModel = await #!{TYPE}.model.findUnique({
				where: {
					#!{RELATION_TO}: this.#!{RELATION_FROM}
				}
      })
			if(dbModel !== null){
				this._#!{NAME} = new #!{TYPE}(dbModel)
			}
    }
		return this._#!{NAME}
  }
`

export const FIELD_GETTER_MANY_TEMPLATE = `
  protected _#!{NAME}: #!{TYPE} | null = null
  async #!{NAME}(): Promise<#!{TYPE} | null> {
    if(this._#!{NAME} === null){
      const dbModels = await #!{TYPE_BASE}.model.findMany({
				where: {
					#!{RELATION_TO}: this.#!{RELATION_FROM}
				}
      })
			if(dbModels.length){
				this._#!{NAME} = []
				for(const dbModel of dbModels)
					this._#!{NAME}.push(new #!{TYPE_BASE}(dbModel))
			}
    }
		return this._#!{NAME}
  }
`