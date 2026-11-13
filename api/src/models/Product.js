const { Schema, model, Types } = require('mongoose');

const productSchema = new Schema({
  // Referência ao produtor (linking): o produtor existe por si e tem muitos produtos
  produtor: { type: Types.ObjectId, ref: 'User', required: true },
  nome: { type: String, required: true, trim: true },
  categoria: {
    type: String,
    enum: ['Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria', 'Outros'],
    required: true
  },
  preco: { type: Number, required: true, min: 0 },
  unidade: { type: String, default: 'kg' }, // kg, unid., garrafa, 500 g…
  stock: { type: Number, default: 0, min: 0 },
  biologico: { type: Boolean, default: false },
  epocas: [{ type: String, enum: ['Primavera', 'Verão', 'Outono', 'Inverno'] }],
  imagemUrl: String // Passo 8: URL da imagem no storage da Cloud
}, { timestamps: true });

// Passo 4: índices para as pesquisas mais frequentes do catálogo
productSchema.index({ categoria: 1, preco: 1 }); // filtro por categoria + preço máximo
productSchema.index({ produtor: 1 });            // produtos de um produtor (página pública e painel)

module.exports = model('Product', productSchema);